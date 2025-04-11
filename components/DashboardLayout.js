import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import DashboardThemeToggle from './DashboardThemeToggle';

export default function DashboardLayout({ children, title }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title || 'Dashboard'} | URL Shortener</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-60 bg-[#131a35] text-white p-6 flex flex-col">
          <div className="text-2xl font-bold mb-8 pb-4 border-b border-white/10">
            <span className="flex items-center">
              <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              URLShortener
            </span>
          </div>
          <nav className="flex flex-col gap-2">
            <Link 
              href="/" 
              className={`flex items-center p-3 rounded-lg ${
                router.pathname === '/' 
                  ? 'bg-[#1a234a]/70 font-medium' 
                  : 'hover:bg-white/10 transition-colors'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </Link>
            <Link 
              href="/urls" 
              className={`flex items-center p-3 rounded-lg ${
                router.pathname === '/urls' || router.pathname.startsWith('/urls/') 
                  ? 'bg-[#1a234a]/70 font-medium' 
                  : 'hover:bg-white/10 transition-colors'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Minhas URLs
            </Link>
            
            <Link 
              href="/stats/all" 
              className={`flex items-center p-3 rounded-lg ${
                router.pathname === '/stats/all' || router.pathname.startsWith('/stats/') 
                  ? 'bg-[#1a234a]/70 font-medium' 
                  : 'hover:bg-white/10 transition-colors'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estatísticas
            </Link>
            
            <Link 
              href="/auth/profile" 
              className={`flex items-center p-3 rounded-lg ${
                router.pathname === '/auth/profile' 
                  ? 'bg-[#1a234a]/70 font-medium' 
                  : 'hover:bg-white/10 transition-colors'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Meu Perfil
            </Link>
            
            {session?.user?.isAdmin && (
              <Link 
                href="/admin/users" 
                className={`flex items-center p-3 rounded-lg ${
                  router.pathname === '/admin/users' 
                    ? 'bg-[#1a234a]/70 font-medium' 
                    : 'hover:bg-white/10 transition-colors'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Gerenciar Usuários
              </Link>
            )}
          </nav>
          <div className="mt-auto pt-8 flex justify-center">
            <DashboardThemeToggle />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-900">
          <div className="flex-1 p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 