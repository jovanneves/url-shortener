import dbConnect from '../../lib/mongodb';
import Url from '../../models/Url';

export default async function handler(req, res) {
  // Conecta ao banco de dados
  await dbConnect();

  // Verifica o método HTTP
  if (req.method === 'GET') {
    try {
      // Busca todas as URLs ordenadas pela data de criação (mais recentes primeiro)
      const urls = await Url.find({}).sort({ createdAt: -1 });
      
      return res.status(200).json(urls);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      const { urlCode } = req.body;
      
      if (!urlCode) {
        return res.status(400).json({ error: 'Código da URL não fornecido' });
      }
      
      // Busca e remove a URL pelo código
      const deletedUrl = await Url.findOneAndDelete({ urlCode });
      
      if (!deletedUrl) {
        return res.status(404).json({ error: 'URL não encontrada' });
      }
      
      return res.status(200).json({ success: true, message: 'URL excluída com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir URL' });
    }
  }
  else {
    return res.status(405).json({ error: 'Método não permitido' });
  }
} 