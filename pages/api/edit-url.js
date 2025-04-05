import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';
import { removeFromCache, setInCache, getFromCache } from '../../lib/redis';
import { pendingClicks, lastUpdateTimes } from './[code]';

export default async function handler(req, res) {
  // Verifica o método HTTP
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Conecta ao banco de dados
  await dbConnect();

  try {
    const { oldUrlCode, newUrlCode, longUrl } = req.body;

    // Valida os dados
    if (!oldUrlCode || !newUrlCode) {
      return res.status(400).json({ error: 'Códigos não fornecidos' });
    }

    // Verifica se o novo código já está em uso (exceto se for o mesmo código)
    if (oldUrlCode !== newUrlCode) {
      const existingUrl = await Url.findOne({ urlCode: newUrlCode });
      if (existingUrl) {
        return res.status(400).json({ error: 'Este apelido já está em uso. Por favor, escolha outro.' });
      }
    }

    // Verifica se a URL existe no cache primeiro
    const oldCacheKey = `url:${oldUrlCode}`;
    let url = await getFromCache(oldCacheKey);
    let updatedFromCache = false;
    
    // Se não estiver no cache, busca no banco de dados
    if (!url) {
      // Busca a URL pelo código atual
      const dbUrl = await Url.findOne({ urlCode: oldUrlCode });
      
      if (!dbUrl) {
        return res.status(404).json({ error: 'URL não encontrada' });
      }
      
      url = dbUrl.toObject();
    } else {
      updatedFromCache = true;
      console.log(`Cache hit para edição da URL: ${oldUrlCode}`);
    }
    
    // Preserva os cliques e o histórico de cliques da URL original
    const currentClicks = url.clicks;
    const clickHistory = url.clickHistory || [];
    
    // Remove a URL antiga do cache
    await removeFromCache(oldCacheKey);
    
    // Se havia cliques pendentes, precisamos salvá-los
    let pendingClicksCount = 0;
    if (pendingClicks[oldUrlCode]) {
      pendingClicksCount = pendingClicks[oldUrlCode];
      pendingClicks[oldUrlCode] = 0; // Zera os cliques pendentes da chave antiga
    }
    
    // Atualiza o código e a URL encurtada
    const baseUrl = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const newShortUrl = `${protocol}://${baseUrl}/${newUrlCode}`;
    
    // Dados atualizados
    const updatedData = {
      urlCode: newUrlCode,
      shortUrl: newShortUrl,
      longUrl: longUrl || url.longUrl // Permite atualizar a URL longa se fornecida
    };
    
    // Atualiza no banco de dados mantendo os clicks e o histórico
    const updatedUrl = await Url.findOneAndUpdate(
      { urlCode: oldUrlCode },
      { 
        ...updatedData,
        // Não atualizamos o número de cliques aqui para manter o valor do banco
      },
      { new: true } // Retorna o documento atualizado
    );
    
    if (!updatedUrl) {
      return res.status(404).json({ error: 'URL não encontrada ao atualizar' });
    }
    
    // Prepara o objeto a ser armazenado no cache
    const cacheObject = updatedUrl.toObject();
    
    // Se a edição foi feita a partir do cache, usa o valor de cliques do cache
    // pois pode conter cliques mais recentes que o banco de dados
    if (updatedFromCache) {
      cacheObject.clicks = currentClicks + pendingClicksCount;
      cacheObject.clickHistory = clickHistory;
    }
    
    // Adiciona a URL atualizada ao cache com o novo código
    await setInCache(`url:${newUrlCode}`, cacheObject, 3600);
    
    // Atualiza o controle de tempo para o novo código
    if (lastUpdateTimes[oldUrlCode]) {
      lastUpdateTimes[newUrlCode] = lastUpdateTimes[oldUrlCode];
      delete lastUpdateTimes[oldUrlCode];
    }
    
    // Transfere os cliques pendentes para o novo código
    if (pendingClicksCount > 0) {
      pendingClicks[newUrlCode] = pendingClicksCount;
    }
    
    console.log(`URL editada com sucesso: ${oldUrlCode} -> ${newUrlCode}`);
    return res.status(200).json({ 
      success: true, 
      message: 'URL atualizada com sucesso',
      url: cacheObject // Retorna o objeto com dados do cache
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
} 