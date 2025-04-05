import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Redirecionar se o usuário já estiver logado
  if (status === 'authenticated') {
    router.push('/urls');
    return null;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validação
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      // Registrar usuário
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });
      
      const registerData = await registerRes.json();
      
      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Erro ao registrar');
      }
      
      // Mostrar mensagem de sucesso em vez de fazer login automático
      setRegistrationComplete(true);
      
    } catch (error) {
      setError(error.message || 'Ocorreu um erro. Tente novamente.');
      console.error('Erro de registro:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mostrar mensagem de confirmação após registro bem-sucedido
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4">
        <Head>
          <title>Registro Concluído | Encurtador de URL</title>
          <meta name="description" content="Registro concluído com sucesso" />
        </Head>
        
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-[#131a35] dark:text-white">
              URL Shortener
            </Link>
          </div>
          
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Registro Concluído!</h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sua conta foi criada com sucesso, mas está aguardando a aprovação de um administrador. 
              Você receberá uma notificação quando sua conta for aprovada.
            </p>
            
            <div className="flex flex-col space-y-3">
              <Link 
                href="/admin/users" 
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Acessar Painel de Administração
              </Link>
              
              <Link href="/auth/login" className="bg-[#131a35] text-white py-2 px-6 rounded-md hover:bg-[#131a35]/90 focus:outline-none focus:ring-2 focus:ring-[#131a35]/50 transition-colors">
                Ir para Login
              </Link>
              
              <Link href="/" className="inline-flex items-center justify-center py-2 text-gray-600 dark:text-gray-400 hover:text-[#131a35] dark:hover:text-white transition-colors mt-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4">
      <Head>
        <title>Criar Conta | Encurtador de URL</title>
        <meta name="description" content="Crie sua conta no serviço de encurtamento de URLs" />
      </Head>
      
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-[#131a35] dark:text-white">
            URL Shortener
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crie sua conta para gerenciar suas URLs encurtadas
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Criar Conta</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
            Após o registro, sua conta ficará pendente de aprovação por um administrador.
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                placeholder="Seu nome"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                placeholder="Confirme sua senha"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#131a35] text-white py-2 px-4 rounded-md hover:bg-[#131a35]/90 focus:outline-none focus:ring-2 focus:ring-[#131a35]/50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-[#131a35] dark:text-blue-400 hover:underline">
                Faça login
              </Link>
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
              <Link href="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-[#131a35] dark:hover:text-white transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 