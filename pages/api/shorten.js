import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { nanoid } from 'nanoid';
import { setInCache } from '../../lib/redis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Conecta ao banco de dados
  await dbConnect();

  try {
    // Verifica se há um usuário logado
    const session = await getServerSession(req, res, authOptions);
    
    const { longUrl, alias, isPublic = true } = req.body;

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
      // Para URLs não-personalizadas, verificamos se o usuário já encurtou esta URL
      // apenas se ele estiver logado e for a mesma pessoa
      if (session?.user) {
        const existingUserUrl = await Url.findOne({ 
          longUrl,
          userId: session.user.id
        });
        
        if (existingUserUrl) {
          return res.status(200).json(existingUserUrl);
        }
      } else {
        // Para usuários não logados, verificamos se a URL já existe e é pública
        const existingPublicUrl = await Url.findOne({ 
          longUrl,
          isPublic: true,
          userId: { $exists: false } // apenas URLs anônimas
        });
        
        if (existingPublicUrl) {
          return res.status(200).json(existingPublicUrl);
        }
      }
      
      // Gera um código aleatório
      urlCode = nanoid(6);
    }
    
    // Prepara os dados da nova URL encurtada
    const urlData = {
      urlCode,
      longUrl,
      clicks: 0,
      createdAt: new Date(),
      isPublic: Boolean(isPublic), // Converte para boolean
    };
    
    // Adiciona informações do usuário se estiver logado
    if (session?.user) {
      urlData.userId = session.user.id;
      urlData.userName = session.user.name || session.user.email.split('@')[0];
    }

    // Salva a nova URL encurtada
    const newUrl = new Url(urlData);
    await newUrl.save();
    
    // Adiciona a nova URL ao cache
    await setInCache(`url:${urlCode}`, newUrl.toObject(), 3600);
    
    return res.status(201).json(newUrl);
  } catch (error) {
    console.error('Erro ao encurtar URL:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 