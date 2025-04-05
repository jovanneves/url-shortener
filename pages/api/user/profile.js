import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  // Verificar a sessão do usuário
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Apenas método PUT é permitido para atualização de perfil
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar se o usuário está ativo
  if (session.user.status !== 'ativo') {
    return res.status(403).json({ error: 'Sua conta não está ativa' });
  }

  const { name } = req.body;

  // Validação básica
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Atualizar o usuário
    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { name: name.trim() } }
    );
    
    return res.status(200).json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 