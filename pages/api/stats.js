import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  // Apenas requisições GET são permitidas
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar a sessão do usuário
    const session = await getServerSession(req, res, authOptions);
    
    // Apenas usuários autenticados podem acessar as estatísticas globais
    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    // Parâmetro opcional para filtrar pelo período
    const period = req.query.period || '7d';
    let daysToLookBack = 7;
    
    switch(period) {
      case '30d':
        daysToLookBack = 30;
        break;
      case '90d':
        daysToLookBack = 90;
        break;
      default:
        daysToLookBack = 7;
    }
    
    // Conectar ao banco de dados
    await dbConnect();
    
    // Buscar todas as URLs (para admins: todas as URLs; para usuários normais: apenas suas URLs)
    const query = session.user.isAdmin ? {} : { userId: session.user.id };
    const urls = await Url.find(query).sort({ clicks: -1 }).limit(100);
    
    // Data de referência para filtrar o histórico de cliques
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToLookBack);
    startDate.setHours(0, 0, 0, 0);
    
    // Processar os dados das URLs
    const processedUrls = urls.map(url => {
      const urlObj = url.toObject();
      
      // Filtrar o histórico de cliques pelo período solicitado
      const recentClickHistory = url.clickHistory.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate;
      });
      
      // Processar dados semanais (últimos 7 dias)
      const weeklyClicks = processWeeklyClicks(recentClickHistory);
      
      // Processar dados mensais (últimas 4 semanas)
      const monthlyClicks = processMonthlyClicks(recentClickHistory);
      
      return {
        ...urlObj,
        weeklyClicks,
        monthlyClicks
      };
    });
    
    return res.status(200).json({ 
      urls: processedUrls,
      period,
      totalUrls: processedUrls.length,
      totalClicks: processedUrls.reduce((sum, url) => sum + url.clicks, 0)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}

// Função para processar cliques semanais (por dia)
function processWeeklyClicks(clickHistory) {
  // Obter dias da semana nos últimos 7 dias
  const today = new Date();
  const result = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Encontrar registro para esta data
    const dayRecord = clickHistory.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === date.getTime();
    });
    
    result.push({
      date: date.toISOString(),
      day: date.getDay(), // 0-6 (domingo-sábado)
      count: dayRecord ? dayRecord.count : 0
    });
  }
  
  return result;
}

// Função para processar cliques mensais (por semana)
function processMonthlyClicks(clickHistory) {
  const today = new Date();
  const result = [];
  
  // Últimas 4 semanas
  for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (weekIndex * 7) - 6);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (weekIndex * 7));
    weekEnd.setHours(23, 59, 59, 999);
    
    // Somar cliques desta semana
    let weekCount = 0;
    
    clickHistory.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= weekStart && recordDate <= weekEnd) {
        weekCount += record.count;
      }
    });
    
    result.push({
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      week: weekIndex,
      count: weekCount
    });
  }
  
  // Inverter para mostrar da semana mais antiga para a mais recente
  return result.reverse();
} 