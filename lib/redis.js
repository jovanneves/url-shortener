import { createClient } from 'redis';

// Cliente Redis global
let redisClient = null;

// Função para inicializar o cliente Redis
export const initRedisClient = async () => {
  try {
    if (!redisClient) {
      console.log('Inicializando cliente Redis...');
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://redis:6379'
      });

      redisClient.on('error', (err) => {
        console.error('Erro Redis:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis conectado com sucesso!');
      });

      await redisClient.connect();
      console.log('Conexão Redis estabelecida!');
    }
    return redisClient;
  } catch (err) {
    console.error('Falha ao conectar com Redis:', err);
    return null;
  }
};

// Inicializa o cliente Redis no carregamento do módulo
initRedisClient().catch(console.error);

// Função para obter dados do cache
export async function getFromCache(key) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await initRedisClient();
    }
    
    if (!redisClient || !redisClient.isOpen) {
      console.log(`Cache desativado ou indisponível para: ${key}`);
      return null;
    }
    
    const data = await redisClient.get(key);
    if (data) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    
    console.log(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar do cache (${key}):`, error);
    return null;
  }
}

// Função para armazenar dados no cache
export async function setInCache(key, data, expireInSeconds = 3600) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await initRedisClient();
    }
    
    if (!redisClient || !redisClient.isOpen) {
      console.log(`Cache desativado ou indisponível para armazenar: ${key}`);
      return false;
    }
    
    await redisClient.set(key, JSON.stringify(data));
    
    if (expireInSeconds) {
      await redisClient.expire(key, expireInSeconds);
    }
    
    console.log(`Armazenado no cache: ${key} (TTL: ${expireInSeconds}s)`);
    return true;
  } catch (error) {
    console.error(`Erro ao armazenar no cache (${key}):`, error);
    return false;
  }
}

// Função para remover dados do cache
export async function removeFromCache(key) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await initRedisClient();
    }
    
    if (!redisClient || !redisClient.isOpen) {
      console.log(`Cache desativado ou indisponível para remover: ${key}`);
      return false;
    }
    
    await redisClient.del(key);
    console.log(`Removido do cache: ${key}`);
    return true;
  } catch (error) {
    console.error(`Erro ao remover do cache (${key}):`, error);
    return false;
  }
}

// Função para limpar o cache relacionado a URLs
export async function clearUrlCache(urlId) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await initRedisClient();
    }
    
    if (!redisClient || !redisClient.isOpen) {
      console.log('Cache desativado ou indisponível para limpar');
      return false;
    }
    
    if (urlId) {
      const key = `url:${urlId}`;
      await redisClient.del(key);
      console.log(`Cache limpo para URL: ${urlId}`);
      return true;
    }
    
    let cursor = 0;
    let totalRemoved = 0;
    
    do {
      const { cursor: newCursor, keys } = await redisClient.scan(cursor, {
        MATCH: 'url:*',
        COUNT: 100
      });
      
      cursor = newCursor;
      
      if (keys.length > 0) {
        await redisClient.del(keys);
        totalRemoved += keys.length;
      }
    } while (cursor !== 0);
    
    console.log(`Cache de URLs limpo. Total removido: ${totalRemoved}`);
    return true;
  } catch (error) {
    console.error('Erro ao limpar cache de URLs:', error);
    return false;
  }
}

// Função para buscar chaves no Redis com base em um padrão
export async function getKeysFromRedis(pattern) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await initRedisClient();
    }
    
    if (!redisClient || !redisClient.isOpen) {
      console.log(`Cache desativado ou indisponível para buscar padrão: ${pattern}`);
      return [];
    }
    
    let cursor = 0;
    let allKeys = [];
    
    try {
      do {
        const scanResult = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        
        if (!scanResult) {
          console.error(`Resultado inválido do SCAN para padrão: ${pattern}`);
          return [];
        }
        
        const newCursor = scanResult.cursor;
        const keys = scanResult.keys || [];
        
        cursor = newCursor;
        
        if (keys.length > 0) {
          allKeys = allKeys.concat(keys);
        }
      } while (cursor !== 0 && cursor !== '0');
      
      console.log(`Encontradas ${allKeys.length} chaves com o padrão: ${pattern}`);
      return allKeys;
    } catch (scanError) {
      console.error(`Erro ao escanear chaves no Redis (${pattern}):`, scanError);
      return [];
    }
  } catch (error) {
    console.error(`Erro ao buscar chaves no Redis (${pattern}):`, error);
    return [];
  }
} 