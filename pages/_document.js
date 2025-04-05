import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR" className="dark">
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Forçar modo escuro como padrão
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 