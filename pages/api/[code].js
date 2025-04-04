import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Conecta ao banco de dados
  await dbConnect();

  try {
    const { code } = req.query;

    // Busca URL pelo código
    const url = await Url.findOne({ urlCode: code });

    if (!url) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }

    // Registrar clique com data atual
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar para o início do dia
    
    // Verificar se já existe registro para hoje
    const todayRecord = url.clickHistory.find(
      record => new Date(record.date).setHours(0,0,0,0) === today.getTime()
    );
    
    if (todayRecord) {
      todayRecord.count += 1;
    } else {
      url.clickHistory.push({
        date: today,
        count: 1
      });
    }
    
    // Incrementa contador de cliques total
    url.clicks += 1;
    await url.save();

    return res.status(200).json(url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 