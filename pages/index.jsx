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
        <meta name="description" content={config?.storeDescription || 'Tienda online'} />
      </Head>

      <main className="w-full pt-16">
        <div className="flex-col gap-10">
          <Hero />
          
          <Section title="Ofertas">
            {loadingOfertas ? (
              <div className="text-center">Cargando ofertas...</div>
            ) : (
              <>
                <div className="w-full flex flex-wrap justify-center gap-12 sm:gap-2">
                  {ofertas.map((articulo, index) => (
                    <CardProduct
                      key={index}
                      name={articulo.art_desc_vta}
                      price={articulo.PRECIO}
                      imageUrl={articulo.CODIGO_BARRA}
                      onAddToCart={(item) => onAddToCart && onAddToCart(item.quantity)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    scrollToTop();
                    window.location.href = '/productos';
                  }}
                  className="bg-transparent text-blue-600 border border-blue-600 py-2 px-8 rounded-2xl hover:text-white hover:bg-blue-600 transition-all duration-300"
                >
                  Ver todos los productos
                </button>
              </>
            )}
          </Section>

          <HeroSlider />

          <Section title="Productos destacados">
            {loadingDestacados ? (
              <div className="text-center">Cargando destacados...</div>
            ) : (
              <>
                <div className="w-full flex flex-wrap justify-center gap-12 sm:gap-2">
                  {destacados.map((articulo, index) => (
                    <CardProduct
                      key={index}
                      name={articulo.art_desc_vta}
                      price={articulo.PRECIO}
                      imageUrl={articulo.CODIGO_BARRA}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    scrollToTop();
                    window.location.href = '/productos';
                  }}
                  className="bg-transparent text-blue-600 border border-blue-600 py-2 px-8 rounded-2xl hover:text-white hover:bg-blue-600 transition-all duration-300"
                >
                  Ver más
                </button>
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