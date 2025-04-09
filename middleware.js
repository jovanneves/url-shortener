import { NextResponse } from 'next/server';
import { initRedisClient } from './lib/redis'; // Importa o inicializador do Redis
import { RateLimiterRedis } from 'rate-limiter-flexible';

let redisClient = null;
let rateLimiter = null;

// Limite: 100 requisições por minuto por IP
const rateLimitOptions = {
  points: 100, // Número de pontos
  duration: 60, // Por segundo (ajuste conforme necessário)
};

// Inicializa o cliente Redis e o Rate Limiter uma vez
async function initialize() {
  if (!redisClient) {
    redisClient = await initRedisClient();
    if (redisClient) {
      rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'middleware',
        ...rateLimitOptions,
      });
      console.log('Rate limiter inicializado com Redis.');
    } else {
      console.error('Falha ao inicializar o Redis para o Rate Limiter.');
    }
  }
}

initialize(); // Chama a inicialização

export async function middleware(request) {
  // Aplica o rate limit apenas a rotas da API
  if (request.nextUrl.pathname.startsWith('/api/') && rateLimiter) {
    const ip = request.ip ?? '127.0.0.1'; // Obtém o IP (ou usa localhost como fallback)

    try {
      await rateLimiter.consume(ip);
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