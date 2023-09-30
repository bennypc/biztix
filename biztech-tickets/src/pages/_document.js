import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <title>BizTix</title>
        <link rel='shortcut icon' href='/biztechlogo.png' />
        <link rel='apple-touch-icon' sizes='180x180' href='/biztechlogo.png' />

        <meta property='og:title' content='BizTix' />

        <meta property='og:url' content='https://biztix.vercel.app/' />
        <meta property='og:type' content='website' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
