import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/url-shortener?authSource=admin';
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000
};

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error(
      'Por favor, defina a variável de ambiente MONGODB_URI'
    );
  }

  try {
    // Conectar mongoose também
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, options);
    }
    
    const client = await MongoClient.connect(uri, options);
    const db = client.db();

    cachedClient = client;
    cachedDb = db;

    console.log('Conectado ao MongoDB com sucesso');
    return { client, db };
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
}

// Exportação padrão para compatibilidade com importações existentes
export default connectToDatabase; 