import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useProducts } from '../hooks/useProducts';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import Hero from '../components/hero/Hero';
import HeroSlider from '../components/hero/HeroSlider';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Section from '../components/common/Section';

const Home = ({ onAddToCart }) => {
  const { config } = useConfig();
  const { products: ofertas, loading: loadingOfertas } = useProducts('/store/articulosOF');
  const { products: destacados, loading: loadingDestacados } = useProducts('/store/articulosDEST');

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Head>
        <title>{config?.storeName ? `INICIO - ${config.storeName}` : 'INICIO - TIENDA'}</title>
        <link rel="icon" href="../public/favicon.ico" />
        <meta name="description" content={config?.storeDescription || 'Tienda online'} />
      </Head>

      <main className="w-full">
        <div className="flex flex-col">
          
          {/* Hero Section */}
          <Hero />
          
          {/* Ofertas Section */}
          <Section title="Ofertas">
            {loadingOfertas ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Cargando ofertas...</p>
              </div>
            ) : (
              <>
                {/* Grid responsivo para products */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4">
                  {ofertas.slice(0, 10).map((articulo, index) => (
                    <CardProduct
                      key={index}
                      name={articulo.art_desc_vta}
                      price={articulo.PRECIO}
                      imageUrl={articulo.CODIGO_BARRA}
                      onAddToCart={(item) => onAddToCart && onAddToCart(item.quantity)}
                    />
                  ))}
                </div>

                {/* Botón Ver Todos */}
                <div className="w-full flex justify-center mt-6 sm:mt-8">
                  <button
                    onClick={() => {
                      scrollToTop();
                      window.location.href = '/productos';
                    }}
                    className="bg-transparent text-blue-600 border border-blue-600 py-2 px-6 sm:py-3 sm:px-8 rounded-lg sm:rounded-xl hover:text-white hover:bg-blue-600 transition-all duration-300 text-sm sm:text-base font-medium"
                  >
                    Ver todos los productos
                  </button>
                </div>
              </>
            )}
          </Section>

          {/* Hero Slider */}
          <HeroSlider />

          {/* Productos Destacados Section */}
          <Section title="Productos destacados">
            {loadingDestacados ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Cargando destacados...</p>
              </div>
            ) : (
              <>
                {/* Grid responsivo para products */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4">
                  {destacados.slice(0, 10).map((articulo, index) => (
                    <CardProduct
                      key={index}
                      name={articulo.art_desc_vta}
                      price={articulo.PRECIO}
                      imageUrl={articulo.CODIGO_BARRA}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                {/* Botón Ver Más */}
                <div className="w-full flex justify-center mt-6 sm:mt-8">
                  <button
                    onClick={() => {
                      scrollToTop();
                      window.location.href = '/productos';
                    }}
                    className="bg-transparent text-blue-600 border border-blue-600 py-2 px-6 sm:py-3 sm:px-8 rounded-lg sm:rounded-xl hover:text-white hover:bg-blue-600 transition-all duration-300 text-sm sm:text-base font-medium"
                  >
                    Ver más
                  </button>
                </div>
              </>
            )}
          </Section>

          <WhatsAppButton />
        </div>
      </main>
    </>
  );
};

export default Home;