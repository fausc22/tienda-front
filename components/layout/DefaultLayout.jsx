import { ConfigProvider } from '../../context/ConfigContext';
import { CartProvider } from '../../context/CartContext';
import Navbar from './Navbar';
import Footer from './Footer';

const DefaultLayout = ({ children }) => {
  return (
    <ConfigProvider>
      <CartProvider>
        <div className="min-h-screen bg-secondary-light dark:bg-primary-dark">
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
          <Footer />
        </div>
      </CartProvider>
    </ConfigProvider>
  );
};

export default DefaultLayout;