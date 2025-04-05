import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { getFromCache, setInCache, removeFromCache } from '../../lib/redis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

// Armazena o último momento em que cada URL foi atualizada no banco de dados
export const lastUpdateTimes = {};
// Tempo mínimo entre atualizações no banco (5 minutos = 300 segundos)
export const UPDATE_INTERVAL = 300;
// Quantidade mínima de cliques para forçar uma atualização no banco
export const MIN_CLICKS_UPDATE = 10;
// Armazena os cliques pendentes para cada URL
export const pendingClicks = {};

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
    
    // ALTERAÇÃO: Verifica se stats é exatamente 'true' para não contabilizar cliques
    // Qualquer outro valor (incluindo 'false' ou undefined) vai contabilizar cliques
    const shouldCountClick = req.query.stats !== 'true';
    
    // Parâmetro que indica se devemos usar apenas o cache sem verificar o banco de dados
    const useOnlyCache = req.query.useCache === 'true';
    // Parâmetro que força atualização do cache a partir do banco
    const forceRefresh = req.query.forceRefresh === 'true';

    console.log(`Procurando URL para código: ${code}, contabilizando clique: ${shouldCountClick}, apenas cache: ${useOnlyCache}, forçar atualização: ${forceRefresh}`);

    // Se forceRefresh for true, buscamos no banco independente do cache
    let url = null;
    let fromCache = false;
    const cacheKey = `url:${code}`;
    
    if (!forceRefresh) {
      // Tenta obter a URL do cache do Redis primeiro
      url = await getFromCache(cacheKey);
    }
    
    // Se não estiver no cache e não for uma requisição para usar apenas o cache, ou se forceRefresh for true, busca no banco de dados
    if ((!url && !useOnlyCache) || forceRefresh) {
      console.log(`${forceRefresh ? 'Atualizando cache' : 'Cache miss'} para ${code}, buscando no banco de dados`);
      // Conecta ao banco de dados
      await dbConnect();

      // Busca URL pelo código
      const dbUrl = await Url.findOne({ urlCode: code });
      
      if (!dbUrl) {
        console.log(`URL não encontrada para código: ${code}`);
        return res.status(404).json({ error: 'URL não encontrada' });
      }

      // Verifica se a URL é privada e se o usuário tem permissão para acessá-la
      if (!dbUrl.isPublic && dbUrl.userId && dbUrl.userId !== userId) {
        // Se a URL é privada e o usuário não é o proprietário
        console.log(`Acesso negado para URL privada: ${code}`);
        return res.status(403).json({ error: 'Esta URL é privada' });
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
      // Se foi solicitado apenas cache e não foi encontrado, retorna erro
      console.log(`URL não encontrada no cache para código: ${code}`);
      return res.status(404).json({ error: 'URL não encontrada no cache' });
    } else {
      fromCache = true;
      console.log(`Cache hit para ${code}`);
      
      // Verifica se a URL é privada e se o usuário tem permissão para acessá-la
      if (url && !url.isPublic && url.userId && url.userId !== userId) {
        // Se a URL é privada e o usuário não é o proprietário
        console.log(`Acesso negado para URL privada (do cache): ${code}`);
        return res.status(403).json({ error: 'Esta URL é privada' });
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
    
    // Incrementa cliques se a requisição não veio da página de estatísticas
    if (shouldCountClick) {
      console.log(`Incrementando clique para ${code}`);
      
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
    } else {
      console.log(`Requisição de estatísticas para URL: ${code}, clique não contabilizado`);
      
      // Para estatísticas, podemos verificar se temos cliques pendentes
      // e fazer uma atualização do banco para mostrar os dados mais recentes
      if (pendingClicks[code] > 0) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeSinceLastUpdate = currentTime - (lastUpdateTimes[code] || 0);
        
        // Se tiver muitos cliques pendentes ou se já passou muito tempo
        if (pendingClicks[code] >= MIN_CLICKS_UPDATE || timeSinceLastUpdate >= UPDATE_INTERVAL) {
          console.log(`Sincronizando banco de dados para estatísticas: ${pendingClicks[code]} cliques pendentes`);
          
          // Atualiza o banco e zera o contador
          const clicksToAdd = pendingClicks[code];
          pendingClicks[code] = 0;
          lastUpdateTimes[code] = currentTime;
          
          // Executa em segundo plano
          updateClicksInDatabase(code, url, clicksToAdd).catch(err => {
            console.error(`Erro ao atualizar cliques no banco de dados para ${code}:`, err);
            pendingClicks[code] += clicksToAdd;
          });
        }
      }
    }

    return res.status(200).json(url);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}

// Função para atualizar os cliques no banco de dados
export async function updateClicksInDatabase(code, url, clicksToAdd) {
  if (clicksToAdd <= 0) return;
  
  await dbConnect();
  const dbUrl = await Url.findOne({ urlCode: code });
  
  if (!dbUrl) {
    console.error(`URL ${code} não encontrada no banco para atualização de cliques`);
    return;
  }
  
  // Pega data de hoje para o histórico
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Busca o registro de hoje no histórico
  const todayTimestamp = today.getTime();
  const todayRecordIndex = dbUrl.clickHistory.findIndex(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === todayTimestamp;
  });
  
  // Atualiza ou cria o registro de hoje
  if (todayRecordIndex !== -1) {
    dbUrl.clickHistory[todayRecordIndex].count += clicksToAdd;
  } else {
    dbUrl.clickHistory.push({
      date: today,
      count: clicksToAdd
    });
  }
  
  // Incrementa contador total de cliques
  dbUrl.clicks += clicksToAdd;
  
  // Não atualiza outros campos como longUrl, apenas os cliques
  // Isso preserva os dados originais como URLs mesmo se alterados no banco
  
  // Salva as mudanças no banco de dados
  await dbUrl.save();
  
  console.log(`Banco de dados atualizado para URL ${code}: +${clicksToAdd} cliques, total: ${dbUrl.clicks}`);
} 