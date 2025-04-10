import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../features/ThemeToggle';
import { useSession } from 'next-auth/react';

/**
 * Layout principal da aplicação com header e footer
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo da página
 * @param {string} [props.title] - Título da página
 */
export default function MainLayout({ children, title = 'URL Shortener' }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950 transition-colors duration-200">
      {/* Header com gradiente */}
      <header className="bg-gradient-to-r from-[#131a35] to-[#1a234a] shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white flex items-center">
                <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                {title}
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                href="/urls"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#293366]/30 border border-[#ffffff20] rounded-md hover:bg-[#293366]/50 transition-colors"
                aria-label="Minhas URLs"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Minhas URLs
              </Link>

              {session?.user?.isAdmin && (
                <Link
                  href="/admin/users"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#293366]/30 border border-[#ffffff20] rounded-md hover:bg-[#293366]/50 transition-colors"
                  aria-label="Painel Admin"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Admin
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} URL Shortener. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Termos de uso"
              >
                Termos
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Política de privacidade"
              >
                Privacidade
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Entre em contato"
              >
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 