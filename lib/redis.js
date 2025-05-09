import { createClient } from 'redis';

// Cliente Redis global
let redisClient = null;
let redisEnabled = true; // Flag to indicate if Redis should be attempted

// Função para inicializar o cliente Redis
export const initRedisClient = async () => {
  try {
    // If Redis is disabled due to previous errors, don't retry on every request
    if (!redisEnabled) {
      console.log('Redis está desativado devido a erros anteriores');
      return null;
    }

    if (!redisClient) {
      console.log('Inicializando cliente Redis...');
      try {
        // Construct Redis URL manually to avoid URL constructor issues
        let redisUrl;
        if (process.env.REDIS_URL) {
          redisUrl = process.env.REDIS_URL;
        } else {
          const host = process.env.REDIS_HOST || 'localhost';
          const port = process.env.REDIS_PORT || '6379';
          redisUrl = `redis://${host}:${port}`;
        }

        console.log(`Conectando ao Redis em: ${redisUrl}`);
        
        redisClient = createClient({
          url: redisUrl
        });

        redisClient.on('error', (err) => {
          console.error('Erro Redis:', err);
        });

        redisClient.on('connect', () => {
          console.log('Redis conectado com sucesso!');
        });

        await redisClient.connect();
        console.log('Conexão Redis estabelecida!');
      } catch (connErr) {
        console.error('Erro ao criar cliente Redis:', connErr);
        redisClient = null;
        // Disable Redis for a period to prevent continuous retries
        redisEnabled = false;
        setTimeout(() => {
          redisEnabled = true;
          console.log('Redis reativado após timeout');
        }, 60000); // Try again after 1 minute
        return null;
      }
    }
    return redisClient;
  } catch (err) {
    console.error('Falha ao conectar com Redis:', err);
    return null;
  }
};

// NÃO inicializa automaticamente - isso será feito sob demanda
// initRedisClient().catch(console.error);

// Função para obter dados do cache
export async function getFromCache(key) {
  try {
    // Se Redis estiver desativado, retorna null imediatamente
    if (!redisEnabled) {
      return null;
    }
    
    if (!redisClient || !redisClient.isOpen) {
      const client = await initRedisClient();
      if (!client) {
        console.log(`Cache desativado ou indisponível para: ${key}`);
        return null;
      }
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
    // Se Redis estiver desativado, retorna false imediatamente
    if (!redisEnabled) {
      return false;
    }
    
    if (!redisClient || !redisClient.isOpen) {
      const client = await initRedisClient();
      if (!client) {
        console.log(`Cache desativado ou indisponível para armazenar: ${key}`);
        return false;
      }
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
    // Se Redis estiver desativado, retorna false imediatamente
    if (!redisEnabled) {
      return false;
    }
    
    if (!redisClient || !redisClient.isOpen) {
      const client = await initRedisClient();
      if (!client) {
        console.log(`Cache desativado ou indisponível para remover: ${key}`);
        return false;
      }
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
    // Se Redis estiver desativado, retorna false imediatamente
    if (!redisEnabled) {
      return false;
    }
    
    if (!redisClient || !redisClient.isOpen) {
      const client = await initRedisClient();
      if (!client) {
        console.log('Cache desativado ou indisponível para limpar');
        return false;
      }
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
    // Se Redis estiver desativado, retorna array vazio imediatamente
    if (!redisEnabled) {
      return [];
    }
    
    if (!redisClient || !redisClient.isOpen) {
      const client = await initRedisClient();
      if (!client) {
        console.log(`Cache desativado ou indisponível para buscar padrão: ${pattern}`);
        return [];
      }
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