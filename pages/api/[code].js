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

    // Incrementa contador de cliques
    url.clicks += 1;
    await url.save();

    return res.status(200).json(url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 