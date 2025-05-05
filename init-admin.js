const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function initializeAdmin() {
  console.log('Iniciando script de criação do usuário admin...');
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI deve estar definida nas variáveis de ambiente');
    }
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');

    const db = client.db('urlshortener');
    
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos nas variáveis de ambiente');
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
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