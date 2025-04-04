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
    // Busca todas as URLs ordenadas pela data de criação (mais recentes primeiro)
    const urls = await Url.find({}).sort({ createdAt: -1 });
    
    return res.status(200).json(urls);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 