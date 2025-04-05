import { connectToDatabase } from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { name, email, password } = req.body;

  // Validação básica
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const { db } = await connectToDatabase();

    // Verificar se o email já está em uso
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está em uso' });
    }

    // Criptografar a senha
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Criar novo usuário com status pendente
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      status: 'pendente', // Status inicial: pendente, ativo, bloqueado
      createdAt: new Date()
    });

    // Retornar resposta de sucesso (sem enviar a senha)
    res.status(201).json({ 
      success: true, 
      user: {
        id: result.insertedId,
        name,
        email,
        isAdmin: false,
        status: 'pendente'
      } 
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 