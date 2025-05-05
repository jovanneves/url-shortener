import { connectToDatabase } from "../../lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  // Este endpoint só deve ser usado em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Este endpoint está desabilitado em produção' });
  }

  // Permitir acesso via GET para facilitar o acesso
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Dados do administrador padrão
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos nas variáveis de ambiente');
    }
    const adminData = {
      name: "Administrador",
      email: process.env.ADMIN_EMAIL,
      password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
      isAdmin: true,
      status: "ativo",
      createdAt: new Date()
    };

    // Verifica se o administrador já existe
    const existingAdmin = await db.collection('users').findOne({ email: adminData.email });
    
    if (existingAdmin) {
      // Atualiza o usuário existente para ter permissões de administrador
      await db.collection('users').updateOne(
        { _id: existingAdmin._id },
        { $set: { isAdmin: true, status: "ativo" } }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: 'Administrador atualizado com sucesso',
        user: {
          id: existingAdmin._id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          isAdmin: true,
          status: "ativo"
        }
      });
    }

    // Cria um novo administrador se não existir
    const result = await db.collection('users').insertOne(adminData);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Administrador criado com sucesso',
      user: {
        id: result.insertedId,
        name: adminData.name,
        email: adminData.email,
        isAdmin: true,
        status: "ativo"
      }
    });
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 