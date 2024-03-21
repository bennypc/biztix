import '@/styles/globals.css';
import { UserProvider } from '../contexts/UserContext.js';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
      <Analytics />
    </UserProvider>
  );
}
