import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { removeFromCache, getFromCache, setInCache, getKeysFromRedis } from '../../lib/redis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  // Conecta ao banco de dados
  await dbConnect();

  // Verifica o método HTTP
  if (req.method === 'GET') {
    try {
      // Verifica se há um usuário logado
      const session = await getServerSession(req, res, authOptions);
      
      // Parâmetros da requisição
      const useOnlyCache = req.query.useCache === 'true';
      const showAll = req.query.all === 'true'; // Mostrar todas as URLs (apenas para admin)
      const onlyPublic = req.query.onlyPublic === 'true'; // Mostrar apenas URLs públicas
      const onlyMine = req.query.onlyMine === 'true'; // Mostrar apenas URLs do usuário
      const publicAccess = req.query.public === 'true'; // Parâmetro específico para acesso público

      // Verifica a autenticação, exceto quando especificamente solicitado acesso público
      if (!session?.user && !publicAccess) {
        return res.status(401).json({ error: 'Não autorizado. Faça login para acessar este recurso.' });
      }

      const userId = session?.user?.id;

      // Se for uma solicitação de acesso público, retorna apenas URLs públicas
      if (publicAccess && !userId) {
        console.log('Acesso público solicitado, buscando apenas URLs públicas');
        const publicUrls = await Url.find({ isPublic: true }).sort({ createdAt: -1 });
        return res.status(200).json(publicUrls);
      }

      // Prepara a consulta com base nos parâmetros
      let query = {};
      let results = [];

      // Administradores podem ver todas as URLs se solicitado
      if (session?.user?.isAdmin && showAll) {
        console.log('Administrador solicitando todas as URLs');
        const allUrls = await Url.find({}).sort({ createdAt: -1 });
        
        // Marca as URLs que pertencem ao usuário logado para UI diferenciada
        results = allUrls.map(url => {
          const urlObj = url.toObject();
          urlObj.isOwner = urlObj.userId === userId;
          return urlObj;
        });
      }
      // Apenas URLs do usuário (públicas e privadas) se solicitado
      else if (onlyMine) {
        console.log(`Buscando apenas URLs do usuário: ${userId}`);
        const userUrls = await Url.find({ userId }).sort({ createdAt: -1 });
        
        // Todas as URLs retornadas pertencem ao usuário
        results = userUrls.map(url => {
          const urlObj = url.toObject();
          urlObj.isOwner = true;
          return urlObj;
        });
      }
      // Apenas URLs públicas se solicitado
      else if (onlyPublic) {
        console.log('Solicitando apenas URLs públicas');
        const publicUrls = await Url.find({ isPublic: true }).sort({ createdAt: -1 });
        
        // Marca as URLs que pertencem ao usuário logado
        results = publicUrls.map(url => {
          const urlObj = url.toObject();
          urlObj.isOwner = urlObj.userId === userId;
          return urlObj;
        });
      }
      // Caso contrário (comportamento padrão), retorna URLs do usuário + URLs públicas
      else {
        console.log('Buscando URLs do usuário e URLs públicas');
        
        // Busca URLs do usuário (privadas e públicas)
        const userUrls = await Url.find({ userId }).sort({ createdAt: -1 });
        
        // Busca URLs públicas que não pertencem ao usuário
        const publicUrls = await Url.find({ 
          isPublic: true,
          userId: { $ne: userId } // não é igual ao userId
        }).sort({ createdAt: -1 });
        
        // Combina os resultados
        const userUrlObjects = userUrls.map(url => {
          const urlObj = url.toObject();
          urlObj.isOwner = true;
          return urlObj;
        });
        
        const publicUrlObjects = publicUrls.map(url => {
          const urlObj = url.toObject();
          urlObj.isOwner = false;
          return urlObj;
        });
        
        // Combina e ordena por data de criação (mais recente primeiro)
        results = [...userUrlObjects, ...publicUrlObjects].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
      
      console.log(`Retornando ${results.length} URLs no total`);
      return res.status(200).json(results);
    } catch (error) {
      console.error('Erro ao buscar URLs:', error);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      // Verifica se há um usuário logado
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }
      
      const { urlCode } = req.body;
      
      if (!urlCode) {
        return res.status(400).json({ error: 'Código da URL não fornecido' });
      }
      
      // Busca a URL pelo código
      const url = await Url.findOne({ urlCode });
      
      if (!url) {
        return res.status(404).json({ error: 'URL não encontrada' });
      }
      
      // Verifica se o usuário tem permissão para excluir
      if (url.userId !== session.user.id && !session.user.isAdmin) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir esta URL' });
      }
      
      // Remove a URL
      await Url.deleteOne({ urlCode });
      
      // Remove a URL do cache
      await removeFromCache(`url:${urlCode}`);
      
      return res.status(200).json({ success: true, message: 'URL excluída com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir URL' });
    }
  }
  else if (req.method === 'PUT') {
    try {
      // Verifica se há um usuário logado
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { urlCode, isPublic } = req.body;
      
      if (!urlCode) {
        return res.status(400).json({ error: 'Código da URL não fornecido' });
      }
      
      // Busca a URL pelo código
      const url = await Url.findOne({ urlCode });
      
      if (!url) {
        return res.status(404).json({ error: 'URL não encontrada' });
      }
      
      // Verifica se o usuário tem permissão para modificar
      if (url.userId !== session.user.id && !session.user.isAdmin) {
        return res.status(403).json({ error: 'Você não tem permissão para modificar esta URL' });
      }
      
      // Atualiza a visibilidade da URL
      url.isPublic = isPublic;
      await url.save();
      
      // Atualiza o cache
      await removeFromCache(`url:${urlCode}`);
      await setInCache(`url:${urlCode}`, url.toObject(), 3600);
      
      // Retorna a URL atualizada com a flag isOwner
      const urlObj = url.toObject();
      urlObj.isOwner = true;
      
      return res.status(200).json({ success: true, message: 'URL atualizada com sucesso', url: urlObj });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar URL' });
    }
  }
  else {
    return res.status(405).json({ error: 'Método não permitido' });
  }
}

// Função auxiliar para obter todas as keys correspondentes a um padrão no Redis
async function getKeysFromCache(pattern) {
  try {
    return await getKeysFromRedis(pattern);
  } catch (error) {
    console.error('Erro ao buscar chaves no Redis:', error);
    return null;
  }
} 