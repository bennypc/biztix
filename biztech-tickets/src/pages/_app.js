import '@/styles/globals.css';
import { UserProvider } from '../contexts/UserContext.js';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </UserProvider>
  );
}
