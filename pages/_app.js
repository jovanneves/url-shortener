import React from 'react';
import '../styles/globals.css'
import Head from 'next/head';

// Estilo global para a animação de shake
const globalStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .animate-shake {
    animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
  }
`;

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>URL Shortener</title>
        <style>{globalStyles}</style>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp 