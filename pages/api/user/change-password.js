import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // Verificar a sessão do usuário
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Apenas método PUT é permitido para alteração de senha
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar se o usuário está ativo
  if (session.user.status !== 'ativo') {
    return res.status(403).json({ error: 'Sua conta não está ativa' });
  }

  const { currentPassword, newPassword } = req.body;

  // Validação básica
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Buscar usuário atual para verificar a senha
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se a senha atual está correta
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    
    // Criptografar a nova senha
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // Atualizar a senha do usuário
    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { password: hashedPassword } }
    );
    
    return res.status(200).json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 