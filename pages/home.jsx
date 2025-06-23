import { useEffect } from 'react';
import Head from 'next/head';
import { useProducts } from '../hooks/useProducts';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import Hero from '../components/hero/Hero';
import HeroSlider from '../components/hero/HeroSlider';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Link from 'next/link';
import { Button } from '@heroui/button';

const Home = () => {
  const { config } = useConfig();
  const { products: ofertas, loading: loadingOfertas } = useProducts('/store/articulosOF');
  const { products: destacados, loading: loadingDestacados } = useProducts('/store/articulosDEST');

  return (
    <>
      <Head>
        <title>{config?.storeName ? `INICIO - ${config.storeName}` : 'INICIO - TIENDA'}</title>
        <meta name="description" content={config?.storeDescription || 'Tienda online'} />
      </Head>

      <div className="min-h-screen">
        <Hero />
        
        {/* Sección Ofertas */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">
                Ofertas
              </h2>
              <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
            </div>

            {loadingOfertas ? (
              <div className="text-center">Cargando ofertas...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {ofertas.map((producto, index) => (
                    <CardProduct
                      key={index}
                      name={producto.art_desc_vta}
                      price={producto.PRECIO}
                      imageUrl={producto.CODIGO_BARRA}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <Link href="/productos">
                    <Button
                      size="lg"
                      variant="bordered"
                      color="primary"
                      className="font-semibold"
                    >
                      Ver todos los productos
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <HeroSlider />

        {/* Sección Destacados */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">
                Productos Destacados
              </h2>
              <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
            </div>

            {loadingDestacados ? (
              <div className="text-center">Cargando destacados...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {destacados.map((producto, index) => (
                    <CardProduct
                      key={index}
                      name={producto.art_desc_vta}
                      price={producto.PRECIO}
                      imageUrl={producto.CODIGO_BARRA}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <Link href="/productos">
                    <Button
                      size="lg"
                      variant="bordered"
                      color="primary"
                      className="font-semibold"
                    >
                      Ver más
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <WhatsAppButton />
      </div>
    </>
  );
};

export default Home;