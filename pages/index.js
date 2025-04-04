import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [urlCode, setUrlCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao encurtar a URL');
      }

      setShortUrl(data.shortUrl);
      setUrlCode(data.urlCode);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert('URL copiada para a área de transferência!');
  };

  return (
    <div className="container">
      <Head>
        <title>Encurtador de URL</title>
        <meta name="description" content="Encurtador de URL criado com Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Encurtador de URL</h1>

        <p className="description">
          Encurte suas URLs de forma rápida e fácil!
        </p>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <input
              type="url"
              placeholder="Digite ou cole sua URL longa aqui"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Encurtando...' : 'Encurtar URL'}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          {success && (
            <div className="result">
              <p>URL encurtada:</p>
              <div className="short-url-container">
                <input type="text" value={shortUrl} readOnly />
                <button onClick={copyToClipboard}>Copiar</button>
              </div>
              <div className="stats-link-container">
                <Link href={`/stats/${urlCode}`} className="stats-link">
                  Ver estatísticas
                </Link>
              </div>
            </div>
          )}
        </div>
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
          max-width: 800px;
          width: 100%;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
          color: #0070f3;
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.5rem;
          margin: 1rem 0 2rem;
        }

        .form-container {
          width: 100%;
          background-color: white;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        form {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        input {
          flex: 1;
          padding: 0.8rem;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
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

        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error {
          color: #e53e3e;
          margin: 1rem 0;
        }

        .result {
          margin-top: 1.5rem;
          width: 100%;
        }

        .short-url-container {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .short-url-container input {
          flex: 1;
          background-color: #f5f5f5;
          cursor: text;
        }

        .stats-link-container {
          margin-top: 1rem;
          text-align: right;
        }

        .stats-link {
          color: #0070f3;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .stats-link:hover {
          text-decoration: underline;
          color: #0051bb;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
} 