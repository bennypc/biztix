import '@/styles/globals.css';
import { UserProvider } from '../contexts/UserContext.js';

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
      <Analytics />
    </UserProvider>
  );
}
