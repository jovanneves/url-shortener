import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password
      });
      
      if (result.error) {
        // Verificar mensagens específicas para estados da conta
        if (result.error.includes('pendente')) {
          setError('Sua conta está pendente de aprovação por um administrador.');
        } else if (result.error.includes('bloqueada')) {
          setError('Sua conta está bloqueada. Entre em contato com o administrador.');
        } else {
          setError('Email ou senha inválidos');
        }
      } else {
        const returnUrl = router.query.returnUrl || '/urls';
        router.push(returnUrl);
      }
    } catch (error) {
      setError('Ocorreu um erro. Tente novamente.');
      console.error('Erro de login:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4">
      <Head>
        <title>Login | Encurtador de URL</title>
        <meta name="description" content="Faça login no serviço de encurtamento de URLs" />
      </Head>
      
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-[#131a35] dark:text-white">
            URLshrink
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Entre para gerenciar suas URLs encurtadas
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Login</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
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
            
            <div className="mb-6">
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
                placeholder="******"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#131a35] text-white py-2 px-4 rounded-md hover:bg-[#131a35]/90 focus:outline-none focus:ring-2 focus:ring-[#131a35]/50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-[#131a35] dark:text-blue-400 hover:underline">
                Registre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 