import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { IoMdCart, IoMdMenu, IoMdClose } from 'react-icons/io';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { config } = useConfig();
  const router = useRouter();

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Productos', href: '/productos' },
  ];

  const scrollToContact = () => {
    const contactElement = document.getElementById('contacto');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-blue-600 text-white z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="font-bold text-base sm:text-lg md:text-xl truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
              {config?.storeName || 'TIENDA'}
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-blue-200 transition-colors duration-300 text-sm lg:text-base font-medium"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={scrollToContact}
              className="hover:text-blue-200 transition-colors duration-300 text-sm lg:text-base font-medium"
            >
              Contacto
            </button>
          </div>

          {/* Right side - Cart and Mobile menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Cart Button */}
            <Link href="/checkout">
              <Button
                variant="flat"
                className="bg-white text-blue-600 hover:bg-gray-100 transition-colors duration-300 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                size="sm"
              >
                <IoMdCart className="text-lg sm:text-xl" />
                {totalItems > 0 && (
                  <span className="ml-1 font-semibold text-xs sm:text-sm">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1 sm:p-2 hover:bg-blue-700 rounded-md transition-colors duration-300"
              aria-label="Abrir menú"
            >
              {menuOpen ? (
                <IoMdClose className="text-xl sm:text-2xl" />
              ) : (
                <IoMdMenu className="text-xl sm:text-2xl" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-700 border-t border-blue-500">
          <div className="px-3 sm:px-4 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 transition-colors duration-300"
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={scrollToContact}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 transition-colors duration-300"
            >
              Contacto
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;