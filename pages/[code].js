import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function RedirectPage() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    async function redirectToUrl() {
      if (!code) return;

      try {
        console.log(`Redirecionando para URL com código: ${code}`);
        const startTime = Date.now();
        const response = await fetch(`/api/${code}?stats=false`);
        const endTime = Date.now();
        console.log(`Tempo de resposta: ${endTime - startTime}ms`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Redirecionando para: ${data.longUrl}`);
          window.location.href = data.longUrl;
        } else {
          console.error('Erro ao redirecionar, código não encontrado.');
          router.push('/');
        }
      } catch (error) {
        console.error('Erro ao redirecionar:', error);
        router.push('/');
      }
    }

    redirectToUrl();
  }, [code, router]);

  return (
    <div className="redirect-container">
      <Head>
        <title>Redirecionando...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="loader-container">
        <div className="loader"></div>
      </div>

      <style jsx>{`
        .redirect-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .loader-container {
          text-align: center;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #131a35;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 