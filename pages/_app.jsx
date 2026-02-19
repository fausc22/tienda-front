import '../styles/globals.css';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import DefaultLayout from '../components/layout/DefaultLayout';

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => (
    <DefaultLayout>{page}</DefaultLayout>
  ));

  return (
    <>
      <Head>
        {/* Favicon global con múltiples referencias para evitar problemas de caché */}
        <link rel="icon" type="image/x-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <link rel="shortcut icon" type="image/x-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <link rel="apple-touch-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
      </Head>
      <div className="bg-secondary-light dark:bg-primary-dark transition duration-300">
        {getLayout(<Component {...pageProps} />)}
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#22c55e',
                color: 'white',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
                color: 'white',
              },
            },
          }}
        />
      </div>
    </>
  );
}

export default MyApp;