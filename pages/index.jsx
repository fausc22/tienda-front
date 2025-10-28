import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useProducts } from '../hooks/useProducts';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import Hero from '../components/hero/Hero';
// import HeroSlider from '../components/hero/HeroSlider';
import BrandCarousel from '../components/showcase/BrandCarousel';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Section from '../components/common/Section';
import { useOfertas } from '../hooks/useOfertas';
import CardProductOferta from '../components/product/CardProductOferta';


const Home = ({ onAddToCart }) => {
  const { config } = useConfig();
  const { ofertas, loading, error } = useOfertas();
  const { products: destacados, loading: loadingDestacados } = useProducts('/store/articulosDEST');

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  // Función para determinar si mostrar una sección
  const shouldShowSection = (products, loading) => {
    return !loading && products && products.length > 0;
  };

  return (
    <>
      <Head>
        <title>{config?.storeName ? `INICIO - ${config.storeName}` : 'INICIO - TIENDA'}</title>
        <link rel="icon" href="https://vps-5234411-x.dattaweb.com/api/images/favicon-tienda.ico" />
        <meta name="description" content={config?.storeDescription || 'Tienda online'} />
      </Head>

      <main className="w-full">
        <div className="flex flex-col">
          
          {/* Hero Section - Siempre se muestra */}
          <Hero />
          
          {/* Ofertas Section - Solo si hay productos en ofertas */}
          {shouldShowSection(ofertas, loading) && (
            <Section title="Ofertas">
              {/* Grid responsivo para productos */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4">
                {ofertas.slice(0, 10).map((articulo, index) => (
                  <CardProductOferta
                    key={index}
                    name={articulo.name}
                    originalPrice={articulo.originalPrice}
                    offerPrice={articulo.offerPrice}
                    imageUrl={articulo.imageUrl}
                    codigoBarra={articulo.codigoBarra}
                    stock={articulo.stock}
                    cod_interno={articulo.cod_interno}
                  />
                ))}
              </div>

              {/* Botón Ver Todos */}
              <div className="w-full flex justify-center mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    scrollToTop();
                    window.location.href = '/tienda/productos';
                  }}
                  className="bg-transparent text-blue-600 border border-blue-600 py-2 px-6 sm:py-3 sm:px-8 rounded-lg sm:rounded-xl hover:text-white hover:bg-blue-600 transition-all duration-300 text-sm sm:text-base font-medium"
                >
                  Ver todos los productos
                </button>
              </div>
            </Section>
          )}

          {/* Loading de ofertas - Solo si está cargando y necesitamos mostrar algo */}
          {loading && (
            <Section title="Ofertas">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Cargando ofertas...</p>
              </div>
            </Section>
          )}

          {/* Hero Slider - Siempre se muestra */}
          {/* <HeroSlider /> */}

          <BrandCarousel />



          {/* Productos Destacados Section - Solo si hay productos destacados */}
          {shouldShowSection(destacados, loadingDestacados) && (
            <Section title="Productos destacados">
              {/* Grid responsivo para productos */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4">
                {destacados.slice(0, 10).map((articulo, index) => (
                    <CardProduct
                      key={index}
                      name={articulo.art_desc_vta}
                      price={articulo.PRECIO}
                      imageUrl={articulo.CODIGO_BARRA}
                      cod_interno={articulo.cod_interno}  // ← AGREGADO
                      onAddToCart={onAddToCart}
                    />
                  ))}
              </div>

              {/* Botón Ver Más */}
              <div className="w-full flex justify-center mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    scrollToTop();
                    window.location.href = '/tienda/productos';
                  }}
                  className="bg-transparent text-blue-600 border border-blue-600 py-2 px-6 sm:py-3 sm:px-8 rounded-lg sm:rounded-xl hover:text-white hover:bg-blue-600 transition-all duration-300 text-sm sm:text-base font-medium"
                >
                  Ver más
                </button>
              </div>
            </Section>
          )}

          {/* Loading de destacados - Solo si está cargando y necesitamos mostrar algo */}
          {loadingDestacados && (
            <Section title="Productos destacados">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Cargando destacados...</p>
              </div>
            </Section>
          )}

          {/* Si no hay ninguna sección de productos, mostrar mensaje alternativo */}
          {!loading && !loadingDestacados && 
           (!ofertas || ofertas.length === 0) && 
           (!destacados || destacados.length === 0) && (
            <Section title="Próximamente">
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">
                  Estamos preparando nuestros productos
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Pronto tendremos ofertas increíbles y productos destacados para ti. 
                  ¡Mantente atento a nuestras novedades!
                </p>
                <button
                  onClick={() => {
                    scrollToTop();
                    window.location.href = '/productos';
                  }}
                  className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium"
                >
                  Ver catálogo completo
                </button>
              </div>
            </Section>
          )}

          <WhatsAppButton />
        </div>
      </main>
    </>
  );
};

export default Home;