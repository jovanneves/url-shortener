import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function StatsPage() {
  const router = useRouter();
  const { code } = router.query;
  const [urlData, setUrlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUrlData() {
      if (!code) return;

      try {
        const response = await fetch(`/api/${code}`);
        
        if (response.ok) {
          const data = await response.json();
          setUrlData(data);
        } else {
          setError('URL não encontrada');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao buscar dados da URL');
      } finally {
        setLoading(false);
      }
    }

    fetchUrlData();
  }, [code]);

  if (loading) return (
    <div className="container">
      <main>
        <h1>Carregando...</h1>
      </main>
      <style jsx>{styles}</style>
    </div>
  );

  if (error) return (
    <div className="container">
      <main>
        <h1>Erro</h1>
        <p className="error">{error}</p>
        <Link href="/" className="button">
          Voltar para a página inicial
        </Link>
      </main>
      <style jsx>{styles}</style>
    </div>
  );

  return (
    <div className="container">
      <Head>
        <title>Estatísticas da URL | Encurtador de URL</title>
      </Head>

      <main>
        <h1>Estatísticas da URL</h1>
        
        <div className="stats-container">
          <div className="stats-card">
            <h2>Código</h2>
            <p className="stat-value">{urlData.urlCode}</p>
          </div>
          
          <div className="stats-card">
            <h2>Cliques</h2>
            <p className="stat-value">{urlData.clicks}</p>
          </div>
          
          <div className="stats-card">
            <h2>Data de criação</h2>
            <p className="stat-value">{new Date(urlData.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="url-details">
          <div className="url-box">
            <h3>URL Original</h3>
            <a href={urlData.longUrl} target="_blank" rel="noopener noreferrer" className="url-link">
              {urlData.longUrl}
            </a>
          </div>
          
          <div className="url-box">
            <h3>URL Encurtada</h3>
            <div className="short-url-container">
              <input type="text" value={urlData.shortUrl} readOnly />
              <button onClick={() => {
                navigator.clipboard.writeText(urlData.shortUrl);
                alert('URL copiada para a área de transferência!');
              }}>Copiar</button>
            </div>
          </div>
        </div>

        <Link href="/" className="button">
          Voltar para a página inicial
        </Link>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
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
    max-width: 800px;
    width: 100%;
  }

  h1 {
    margin: 0 0 2rem;
    line-height: 1.15;
    font-size: 2.5rem;
    text-align: center;
    color: #0070f3;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
    color: #666;
  }

  h3 {
    margin: 0 0 1rem;
    font-size: 1.2rem;
    color: #333;
  }

  .stats-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    margin-bottom: 2rem;
  }

  .stats-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    flex: 1;
    min-width: 200px;
    text-align: center;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #0070f3;
    margin: 0;
  }

  .url-details {
    width: 100%;
    margin-bottom: 2rem;
  }

  .url-box {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
  }

  .url-link {
    word-break: break-all;
    color: #0070f3;
    text-decoration: none;
  }

  .url-link:hover {
    text-decoration: underline;
  }

  .short-url-container {
    display: flex;
    gap: 1rem;
  }

  input {
    flex: 1;
    padding: 0.8rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f5f5f5;
  }

  button {
    padding: 0.8rem 1.5rem;
    background-color: #0070f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: #0051bb;
  }

  .button {
    display: inline-block;
    padding: 0.8rem 1.5rem;
    background-color: #0070f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    text-decoration: none;
    transition: background-color 0.2s;
  }

  .button:hover {
    background-color: #0051bb;
  }

  .error {
    color: #e53e3e;
    margin-bottom: 1rem;
  }
`; 