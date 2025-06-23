import '../styles/globals.css';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import DefaultLayout from '../components/layout/DefaultLayout';

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => (
    <DefaultLayout>{page}</DefaultLayout>
  ));

  return (
    <AnimatePresence>
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
    </AnimatePresence>
  );
}

export default MyApp;