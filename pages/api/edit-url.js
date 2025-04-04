import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Conecta ao banco de dados
  await dbConnect();

  try {
    const { oldUrlCode, newUrlCode } = req.body;

    // Valida os dados
    if (!oldUrlCode || !newUrlCode) {
      return res.status(400).json({ error: 'Códigos não fornecidos' });
    }

    // Verifica se o novo código já está em uso
    const existingUrl = await Url.findOne({ urlCode: newUrlCode });
    if (existingUrl) {
      return res.status(400).json({ error: 'Este apelido já está em uso. Por favor, escolha outro.' });
    }

    // Busca a URL pelo código atual
    const url = await Url.findOne({ urlCode: oldUrlCode });

    if (!url) {
      return res.status(404).json({ error: 'URL não encontrada' });
    }

    // Atualiza o código e a URL encurtada
    const baseUrl = req.headers.host;
    const newShortUrl = `${baseUrl}/${newUrlCode}`;

    url.urlCode = newUrlCode;
    url.shortUrl = newShortUrl;

    await url.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'URL atualizada com sucesso',
      url: url
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 