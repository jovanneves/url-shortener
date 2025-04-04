import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Conecta ao banco de dados
  await dbConnect();

  try {
    const { longUrl } = req.body;

    // Valida a URL
    if (!longUrl) {
      return res.status(400).json({ error: 'URL não fornecida' });
    }

    // Tenta encontrar se a URL já foi encurtada
    const url = await Url.findOne({ longUrl });
    if (url) {
      return res.status(200).json(url);
    }

    // Cria um novo código curto
    const urlCode = nanoid(6);
    const baseUrl = req.headers.host;
    const shortUrl = `${baseUrl}/${urlCode}`;

    // Salva a nova URL encurtada
    const newUrl = new Url({
      urlCode,
      longUrl,
      shortUrl,
      clicks: 0,
      createdAt: new Date(),
    });

    await newUrl.save();
    return res.status(201).json(newUrl);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 