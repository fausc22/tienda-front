import Link from 'next/link';
import { useConfig } from '../../context/ConfigContext';

const Footer = () => {
  const { config } = useConfig();

  const scrollToContact = () => {
    const contactElement = document.getElementById('contacto');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const googleMapsUrl = config?.storeAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.storeAddress)}`
    : '#';

  return (
    <footer id="contacto" className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Store Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {config?.storeName || 'TIENDA'}
            </h3>
            <p className="text-blue-200 mb-4">
              {config?.storeDescription || 'Tu tienda online de confianza'}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-blue-200 hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-blue-200 hover:text-white transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <button
                  onClick={scrollToContact}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              {config?.storeInstagram && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zm5.568 13.905c0 1.854-1.5 3.354-3.354 3.354H9.768c-1.854 0-3.354-1.5-3.354-3.354V9.442c0-1.854 1.5-3.354 3.354-3.354h4.463c1.854 0 3.354 1.5 3.354 3.354v4.463z"/>
                  </svg>
                  <span className="text-blue-200">{config.storeInstagram}</span>
                </div>
              )}
              
              {config?.storeEmail && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-blue-200">{config.storeEmail}</span>
                </div>
              )}
              
              {config?.storePhone && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                  </svg>
                  <span className="text-blue-200">{config.storePhone}</span>
                </div>
              )}
              
              {config?.storeAddress && (
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200 hover:text-white transition-colors"
                  >
                    {config.storeAddress}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-500 mt-8 pt-8 text-center">
          <p className="text-blue-200">
            © {new Date().getFullYear()} {config?.storeName || 'TIENDA'}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;