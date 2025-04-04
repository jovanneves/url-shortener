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
    const { longUrl, alias } = req.body;

    // Valida a URL
    if (!longUrl) {
      return res.status(400).json({ error: 'URL não fornecida' });
    }

    // Verifica se o alias contém apenas caracteres válidos
    if (alias && !/^[a-zA-Z0-9-_]+$/.test(alias)) {
      return res.status(400).json({ error: 'Apelido contém caracteres inválidos. Use apenas letras, números, hífens e sublinhados.' });
    }

    // Determina o código a ser usado
    let urlCode;
    
    if (alias) {
      // Verifica se o alias já está em uso
      const existingAlias = await Url.findOne({ urlCode: alias });
      if (existingAlias) {
        return res.status(400).json({ error: 'Este apelido já está em uso. Por favor, escolha outro.' });
      }
      urlCode = alias;
    } else {
      // Tenta encontrar se a URL já foi encurtada (apenas quando não tem alias específico)
      const existingUrl = await Url.findOne({ longUrl });
      if (existingUrl) {
        return res.status(200).json(existingUrl);
      }
      
      // Gera um código aleatório
      urlCode = nanoid(6);
    }
    
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