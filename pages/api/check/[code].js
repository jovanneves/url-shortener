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