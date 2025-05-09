import { NextResponse } from 'next/server';
import { initRedisClient } from './lib/redis'; // Importa o inicializador do Redis
import { RateLimiterRedis } from 'rate-limiter-flexible';

let redisClient = null;
let rateLimiter = null;
let isRedisAvailable = true;

// Rate limiter em memória (fallback)
const ipRequests = new Map();

// Limite: 100 requisições por minuto por IP
const rateLimitOptions = {
  points: 100, // Número de pontos
  duration: 60, // Por segundo (ajuste conforme necessário)
};

// Inicializa o cliente Redis e o Rate Limiter uma vez
async function initialize() {
  try {
    if (!redisClient && isRedisAvailable) {
      redisClient = await initRedisClient();
      if (redisClient) {
        rateLimiter = new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'middleware',
          ...rateLimitOptions,
        });
        console.log('Rate limiter inicializado com Redis.');
      } else {
        console.log('Redis não disponível. Usando rate limiter em memória.');
        isRedisAvailable = false;
        // Reativa a checagem de Redis após 1 minuto
        setTimeout(() => {
          isRedisAvailable = true;
        }, 60000);
      }
    }
  } catch (error) {
    console.error('Falha ao inicializar o Redis para o Rate Limiter:', error);
    isRedisAvailable = false;
    // Reativa a checagem de Redis após 1 minuto
    setTimeout(() => {
      isRedisAvailable = true;
    }, 60000);
  }
}

// Limpa o mapa de requisições em memória a cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.timestamp > rateLimitOptions.duration * 1000) {
      ipRequests.delete(ip);
    }
  }
}, 60000);

initialize(); // Chama a inicialização

// Função de rate limiting em memória (fallback)
function memoryRateLimiter(ip) {
  const now = Date.now();
  const record = ipRequests.get(ip) || { count: 0, timestamp: now };
  
  // Se o registro for antigo, reinicia a contagem
  if (now - record.timestamp > rateLimitOptions.duration * 1000) {
    record.count = 1;
    record.timestamp = now;
    ipRequests.set(ip, record);
    return true;
  }
  
  // Incrementa a contagem e verifica se excede o limite
  record.count += 1;
  ipRequests.set(ip, record);
  
  return record.count <= rateLimitOptions.points;
}

export async function middleware(request) {
  // Aplica o rate limit apenas a rotas da API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1'; // Obtém o IP (ou usa localhost como fallback)

    try {
      // Tenta usar o rate limiter Redis se disponível
      if (rateLimiter) {
        await rateLimiter.consume(ip);
      } else {
        // Fallback para rate limiter em memória
        const allowed = memoryRateLimiter(ip);
        if (!allowed) {
          console.warn(`Rate limit excedido para IP: ${ip} na rota: ${request.nextUrl.pathname} (memória)`);
          return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60', // Tenta novamente após 60 segundos
              },
            }
          );
        }
      }
      
      // Se chegou aqui, o limite não foi excedido
      return NextResponse.next(); // Continua para a rota da API
    } catch (rateLimiterRes) {
      // Se caiu aqui, o limite foi excedido
      console.warn(`Rate limit excedido para IP: ${ip} na rota: ${request.nextUrl.pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimiterRes.msBeforeNext / 1000, // Informa quando tentar novamente
          },
        }
      );
    }
  }

  // Para rotas não-API, continua normalmente
  return NextResponse.next();
}

// Configuração para quais rotas o middleware deve rodar
export const config = {
  matcher: '/api/:path*', // Aplica a todas as rotas sob /api/
}; 