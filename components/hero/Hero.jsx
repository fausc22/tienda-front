import Link from 'next/link';
import { useConfig } from '../../context/ConfigContext';

const Hero = () => {
  const { config } = useConfig();

  return (
    <div className="w-full">
      <div className="relative w-full h-[500px]">
        {/* Background image - you'll need to add this image to public/images/ */}
        <div 
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
          style={{
            backgroundImage: 'url(/images/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Content overlay */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-start gap-8 px-8 md:px-24 lg:px-24 lg:pr-96 text-white z-10 bg-black bg-opacity-70 sm:px-12">
          <h1 className="text-6xl font-bold sm:text-4xl">
            {config?.storeName || 'TIENDA'}
          </h1>
          
          <p className="text-xl leading-relaxed">
            {config?.storeDescription || 'Bienvenido a nuestra tienda online'}
          </p>
          
          <Link href="/productos">
            <button className="text-white bg-blue-600 py-3 px-4 rounded-2xl hover:bg-transparent hover:text-white hover:border hover:border-white transition-all duration-300">
              Ver Productos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;