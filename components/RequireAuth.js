import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function RequireAuth({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return; // Aguardar carregamento
    
    if (!session) {
      router.push({
        pathname: '/auth/login',
        query: { returnUrl: router.asPath },
      });
    }
  }, [session, status, router]);
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-dark-700 border-t-primary-400 dark:border-t-primary-400 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }
  
  return <>{children}</>;
} 