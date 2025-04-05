import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { removeFromCache, getFromCache, setInCache, getKeysFromRedis } from '../../lib/redis';

export default async function handler(req, res) {
  // Conecta ao banco de dados
  await dbConnect();

  // Verifica o método HTTP
  if (req.method === 'GET') {
    try {
      const useOnlyCache = req.query.useCache === 'true';
      
      // Tenta primeiro encontrar todas as URLs no cache
      const urlKeys = await getKeysFromCache('url:*');
      const urls = [];
      
      if (urlKeys && urlKeys.length > 0) {
        // Recupera todas as URLs do cache
        for (const key of urlKeys) {
          const url = await getFromCache(key);
          if (url) {
            urls.push(url);
          }
        }
        
        if (urls.length > 0) {
          console.log(`Retornando ${urls.length} URLs do cache`);
          // Ordena por data de criação (mais recentes primeiro)
          return res.status(200).json(urls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
      }
      
      // Se não houver dados no cache ou não forem encontradas URLs, busca no banco
      // a menos que useOnlyCache seja true
      if (!useOnlyCache) {
        console.log('Buscando URLs no banco de dados');
        // Busca todas as URLs ordenadas pela data de criação (mais recentes primeiro)
        const dbUrls = await Url.find({}).sort({ createdAt: -1 });
        
        if (dbUrls && dbUrls.length > 0) {
          console.log(`Encontradas ${dbUrls.length} URLs no banco de dados, armazenando no cache`);
          // Armazena cada URL no cache
          for (const url of dbUrls) {
            await setInCache(`url:${url.urlCode}`, url.toObject(), 3600);
          }
          
          return res.status(200).json(dbUrls);
        } else {
          console.log('Nenhuma URL encontrada no banco de dados');
          return res.status(200).json([]);
        }
      } else {
        // Se foi solicitado apenas cache e não encontrou nada, retorna array vazio
        console.log('Requisição solicitada apenas do cache, sem resultados encontrados');
        return res.status(200).json([]);
      }
    } catch (error) {
      console.error('Erro ao buscar URLs:', error);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      const { urlCode } = req.body;
      
      if (!urlCode) {
        return res.status(400).json({ error: 'Código da URL não fornecido' });
      }
      
      // Busca e remove a URL pelo código
      const deletedUrl = await Url.findOneAndDelete({ urlCode });
      
      if (!deletedUrl) {
        return res.status(404).json({ error: 'URL não encontrada' });
      }
      
      // Remove a URL do cache
      await removeFromCache(`url:${urlCode}`);
      
      return res.status(200).json({ success: true, message: 'URL excluída com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir URL' });
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