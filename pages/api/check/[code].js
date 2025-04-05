import dbConnect from '../../../lib/mongodb';
import Url from '../../../models/Url';

export default async function handler(req, res) {
  // Aceita apenas o método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { code } = req.query;

  // Verifica se o código foi fornecido
  if (!code) {
    return res.status(400).json({ error: 'Código não fornecido' });
  }

  try {
    // Conecta ao banco de dados
    await dbConnect();

    // Busca a URL pelo código
    const url = await Url.findOne({ urlCode: code });

    // Retorna se existe ou não
    if (url) {
      // Se a URL existe e foi requisitada para ser acessada, registra um clique
      if (req.query.stats === 'false') {
        // Registrar clique com data atual
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar para o início do dia
        
        // Verificar se já existe registro para hoje
        const todayTimestamp = today.getTime();
        
        // Encontrar o índice do registro de hoje (se existir)
        const todayRecordIndex = url.clickHistory.findIndex(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === todayTimestamp;
        });
        
        if (todayRecordIndex !== -1) {
          // Atualizar o registro existente
          url.clickHistory[todayRecordIndex].count += 1;
        } else {
          // Criar um novo registro para hoje
          url.clickHistory.push({
            date: today,
            count: 1
          });
        }
        
        // Incrementa contador de cliques total
        url.clicks += 1;
        
        // Salva as mudanças no banco de dados
        await url.save();
        
        console.log(`Clique registrado via verificação para URL: ${code}`);
      }

      return res.status(200).json({ 
        exists: true, 
        longUrl: url.longUrl,
        shortUrl: url.shortUrl,
        clicks: url.clicks
      });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 