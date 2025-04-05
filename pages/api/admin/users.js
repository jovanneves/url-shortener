import { connectToDatabase } from "../../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  // Verificar a sessão do usuário
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado. Somente administradores podem acessar.' });
  }

  const { db } = await connectToDatabase();
  
  // GET: Listar todos os usuários
  if (req.method === 'GET') {
    try {
      const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
      
      // Remover dados sensíveis como senha
      const sanitizedUsers = users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        status: user.status || 'pendente',
        createdAt: user.createdAt
      }));
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // PUT: Atualizar status ou permissões de um usuário
  if (req.method === 'PUT') {
    const { userId, status, isAdmin } = req.body;
    
    if (!userId || (!status && isAdmin === undefined)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    try {
      // Verifica se o usuário existe
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verifica se o usuário está tentando alterar seu próprio status de admin
      if (session.user.id === userId && isAdmin !== undefined && !isAdmin) {
        return res.status(400).json({ error: 'Você não pode remover seu próprio status de administrador' });
      }
      
      // Preparar objeto de atualização
      const updateObj = {};
      if (status) updateObj.status = status;
      if (isAdmin !== undefined) updateObj.isAdmin = isAdmin;
      
      // Atualizar usuário
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateObj }
      );
      
      return res.status(200).json({ success: true, message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // Se o método não for GET ou PUT
  return res.status(405).json({ error: 'Método não permitido' });
} 