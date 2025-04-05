const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function initializeAdmin() {
  console.log('Iniciando script de criação do usuário admin...');
  
  try {
    // Conectar ao MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://admin:password@mongodb:27017/urlshortner?authSource=admin';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');

    const db = client.db('urlshortner');
    
    // Usar variáveis de ambiente ou valores padrão
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '@dm1n';
    
    // Dados do administrador
    const adminData = {
      name: "Administrador",
      email: adminEmail,
      password: bcrypt.hashSync(adminPassword, 10),
      isAdmin: true,
      status: "ativo",
      createdAt: new Date()
    };

    // Verificar se o administrador já existe
    const existingAdmin = await db.collection('users').findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Administrador já existe, pulando criação...');
    } else {
      // Criar novo administrador
      const result = await db.collection('users').insertOne(adminData);
      console.log(`Administrador criado com sucesso! ID: ${result.insertedId}`);
      console.log(`- Email: ${adminData.email}`);
      console.log(`- Senha: ${adminPassword}`);
    }

    // Fechar conexão
    await client.close();
    console.log('Operação concluída com sucesso!');

  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  }
}

// Executar o script
initializeAdmin(); 