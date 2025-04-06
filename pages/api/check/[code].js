import dbConnect from '../../../lib/mongodb';
import Url from '../../../models/Url';
import { getFromCache, setInCache } from '../../../lib/redis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Importa as variáveis globais do outro arquivo
import { 
  lastUpdateTimes,
  pendingClicks,
  updateClicksInDatabase,
  UPDATE_INTERVAL, 
  MIN_CLICKS_UPDATE 
} from '../../api/[code]';

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { code } = req.query;
    
    // Verifica a sessão do usuário
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    
    // Parâmetro que indica se devemos usar apenas o cache sem verificar o banco de dados
    const useOnlyCache = req.query.useCache === 'true';

    // ALTERAÇÃO: Verifica se stats é exatamente 'true' para não contabilizar cliques
    // Qualquer outro valor (incluindo 'false' ou undefined) vai contabilizar cliques
    const shouldCountClick = req.query.stats !== 'true';

    if (!code) {
      return res.status(400).json({ error: 'Código não fornecido' });
    }

    // Tenta obter a URL do cache primeiro
    const cacheKey = `url:${code}`;
    let url = await getFromCache(cacheKey);
    let fromCache = false;

    // Se não estiver no cache e não for uma requisição para usar apenas o cache, busca no banco de dados
    if (!url && !useOnlyCache) {
      console.log(`Cache miss no endpoint de verificação para ${code}, buscando no banco de dados`);
      
      // Conecta ao banco de dados
      await dbConnect();
      
      // Busca URL pelo código
      const dbUrl = await Url.findOne({ urlCode: code });
      
      if (!dbUrl) {
        return res.status(200).json({ exists: false });
      }
      
      // Verifica se a URL é privada e se o usuário tem permissão para acessá-la
      if (!dbUrl.isPublic && dbUrl.userId && dbUrl.userId !== userId) {
        // Para URLs privadas, fingimos que não existe para não-proprietários
        return res.status(200).json({ exists: false, isPrivate: true });
      }
      
      // Converte o modelo do Mongoose para um objeto simples
      url = dbUrl.toObject();
      
      // Armazena no cache por 1 hora (3600 segundos)
      console.log(`Armazenando no cache: ${cacheKey}`);
      await setInCache(cacheKey, url, 3600);
      
      // Inicializa o contador de cliques pendentes
      pendingClicks[code] = 0;
      // Registra o momento atual como última atualização
      lastUpdateTimes[code] = Math.floor(Date.now() / 1000);
    } else if (!url && useOnlyCache) {
      // Se foi solicitado apenas cache e não foi encontrado, retorna que não existe
      console.log(`URL não encontrada no cache para código: ${code}`);
      return res.status(200).json({ exists: false });
    } else {
      fromCache = true;
      console.log(`Cache hit no endpoint de verificação para ${code}`);
      
      // Verifica se a URL é privada e se o usuário tem permissão para acessá-la
      if (url && !url.isPublic && url.userId && url.userId !== userId) {
        // Para URLs privadas, fingimos que não existe para não-proprietários
        return res.status(200).json({ exists: false, isPrivate: true });
      }
      
      // Se não tem cliques pendentes, inicializa
      if (pendingClicks[code] === undefined) {
        pendingClicks[code] = 0;
      }
      
      // Se não tem registro de última atualização, inicializa
      if (!lastUpdateTimes[code]) {
        lastUpdateTimes[code] = Math.floor(Date.now() / 1000);
      }
    }

    // Se devemos incrementar cliques
    if (shouldCountClick) {
      console.log(`Incrementando clique para ${code} na verificação`);
      
      // Incrementa contador no cache e nos pendentes
      url.clicks += 1;
      if (pendingClicks[code] === undefined) {
        pendingClicks[code] = 0;
      }
      pendingClicks[code] += 1;
      
      // ALTERAÇÃO: Atualizar sempre o banco de dados para garantir
      // que os cliques sejam contabilizados corretamente
      console.log(`Atualizando banco de dados para URL ${code} após ${pendingClicks[code]} cliques pendentes`);
      
      // Zera o contador de pendentes para esta URL
      const clicksToAdd = pendingClicks[code];
      pendingClicks[code] = 0;
      
      // Atualiza o timestamp
      lastUpdateTimes[code] = Math.floor(Date.now() / 1000);
      
      // Executa a atualização do banco em segundo plano
      updateClicksInDatabase(code, url, clicksToAdd).catch(err => {
        console.error(`Erro ao atualizar cliques no banco de dados para ${code}:`, err);
        // Se falhar, retorna os cliques ao contador pendente
        pendingClicks[code] += clicksToAdd;
      });
      
      // Atualiza apenas o cache com os novos dados de cliques
      await setInCache(cacheKey, url, 3600);
    }

    console.log(`Retornando dados da URL para verificação: ${code}`);
    return res.status(200).json({ 
      exists: true, 
      longUrl: url.longUrl,
      urlCode: url.urlCode,
      clicks: url.clicks,
      isPublic: url.isPublic,
      userId: url.userId
    });
  } catch (error) {
    console.error('Erro ao verificar URL:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 