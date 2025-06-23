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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            {config?.storeName || 'TIENDA'}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-blue-200 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={scrollToContact}
              className="hover:text-blue-200 transition-colors"
            >
              Contacto
            </button>
          </div>

          {/* Cart Button */}
          <Link href="/checkout">
            <Button
              variant="flat"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <IoMdCart className="text-xl" />
              {totalItems > 0 && (
                <span className="ml-1 font-semibold">{totalItems}</span>
              )}
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
          >
            {menuOpen ? <IoMdClose size={24} /> : <IoMdMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 hover:bg-blue-600 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={scrollToContact}
              className="block w-full text-left px-3 py-2 hover:bg-blue-600 rounded-md"
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