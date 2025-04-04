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
        const response = await fetch(`/api/${code}?stats=false`);
        
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.longUrl;
        } else {
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
    <div className="container">
      <Head>
        <title>Redirecionando...</title>
      </Head>

      <main>
        <h1>Redirecionando...</h1>
        <p>Você será redirecionado em breve. Se não for redirecionado automaticamente, <Link href="/" className="redirect-link">clique aqui</Link>.</p>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        h1 {
          margin: 0 0 1rem;
          line-height: 1.15;
          font-size: 2.5rem;
          color: #0070f3;
        }

        p {
          line-height: 1.5;
          font-size: 1.25rem;
        }

        .redirect-link {
          color: #0070f3;
          text-decoration: none;
        }

        .redirect-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
} 