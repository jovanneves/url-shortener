import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../../lib/mongodb";

// Log temporário para depuração
console.log('ENV NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);
console.log('ENV NODE_ENV:', process.env.NODE_ENV);
console.log('ENV NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('Todas as variáveis de ambiente:', Object.keys(process.env));

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        const { db } = await connectToDatabase();
        
        // Encontrar usuário no banco de dados
        const user = await db.collection("users").findOne({ 
          email: credentials.email 
        });
        
        // Verificar se o usuário existe e se a senha está correta
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          // Verificar status do usuário
          if (user.status === 'pendente') {
            throw new Error('Sua conta está pendente de aprovação por um administrador.');
          }
          
          if (user.status === 'bloqueado') {
            throw new Error('Sua conta está bloqueada. Entre em contato com o administrador.');
          }
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin || false,
            status: user.status || 'ativo',
          };
        }
        
        // Se as credenciais estiverem incorretas
        return null;
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.status = user.status;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.status = token.status;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: (() => {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET deve estar definida nas variáveis de ambiente');
    }
    return process.env.NEXTAUTH_SECRET;
  })(),
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions); 