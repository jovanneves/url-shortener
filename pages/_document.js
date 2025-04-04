import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('theme');
                  
                  // Usar dark como padrão independente da preferência do sistema
                  if (mode === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // Usar dark como padrão
                    document.documentElement.classList.add('dark');
                    if (!mode) localStorage.setItem('theme', 'dark');
                  }
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