import { useState } from 'react';
import { Button } from '@heroui/button';
import { IoMdAdd, IoMdRemove } from 'react-icons/io';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../../hooks/useProducts';


const CardProduct = ({ name, price, imageUrl, originalPrice, cod_interno }) => {
  const [quantity, setQuantity] = useState(0);
  const { dispatch } = useCart();

  // Formatear los precios al recibir las props
  const formattedPrice = formatPrice(price);
  const formattedOriginalPrice = originalPrice ? formatPrice(originalPrice) : null;
  const numericPrice = Math.round(parseFloat(price));

  const handleIncrease = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrease = () => {
    setQuantity(prev => prev > 0 ? prev - 1 : 0);
  };

  const handleAddToCart = () => {
    if (quantity === 0) return;

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        name,
        price: numericPrice,
        imageUrl,
        cod_interno: cod_interno,
        codigo_barra: imageUrl,
        quantity
      }
    });

    toast.success('Agregado al carrito', {
      duration: 1500,
      position: 'top-right',
      style: {
        fontSize: '14px',
        padding: '8px 12px',
      },
    });

    setQuantity(0);
  };

  const total = Math.round(numericPrice * quantity);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-2 sm:p-3 md:p-4 flex flex-col h-full group">
      
      {/* Contenedor de imagen - Altura reducida y fija */}
      <div className="w-full h-20 sm:h-24 md:h-28 lg:h-32 mb-2 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden relative flex-shrink-0">
        <img
          src={`https://vps-5234411-x.dattaweb.com/api/images/products/${imageUrl}.png`}
          alt={name}
          className="max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
          }}
        />
      </div>

      {/* Información del producto */}
      <div className="flex flex-col flex-grow space-y-1.5 sm:space-y-2">
        
        {/* Nombre del producto - Con altura mínima y máxima, texto completo visible */}
        <div className="min-h-[2.5rem] sm:min-h-[3rem] max-h-[4.5rem] sm:max-h-[5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <h3 
            className="text-xs sm:text-sm md:text-base font-medium text-gray-800 dark:text-white leading-snug break-words pr-1"
            title={name} // Tooltip nativo del navegador
          >
            {name}
          </h3>
        </div>

        {/* Precios */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          {formattedOriginalPrice && (
            <span className="text-xs text-red-500 line-through">
              ${formattedOriginalPrice}
            </span>
          )}
          <span className="text-sm sm:text-base md:text-lg font-bold text-blue-600">
            ${formattedPrice}
          </span>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-2 flex-shrink-0">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={handleDecrease}
            disabled={quantity === 0}
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 min-w-0 text-xs"
          >
            <IoMdRemove className="text-xs sm:text-sm" />
          </Button>
          
          <span className="w-6 sm:w-8 text-center font-semibold text-xs sm:text-sm">
            {quantity}
          </span>
          
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={handleIncrease}
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 min-w-0 text-xs"
          >
            <IoMdAdd className="text-xs sm:text-sm" />
          </Button>
        </div>

        {/* Total */}
        {quantity > 0 && (
          <div className="text-center py-0.5 sm:py-1 flex-shrink-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total: ${total.toFixed(2)}
            </p>
          </div>
        )}

        {/* Botón agregar - Siempre al final */}
        <div className="mt-auto pt-1 sm:pt-2 flex-shrink-0">
          <Button
            fullWidth
            color="primary"
            onClick={handleAddToCart}
            disabled={quantity === 0}
            className="font-medium text-xs sm:text-sm h-7 sm:h-8 md:h-9 px-2"
            size="sm"
          >
            <span className="hidden sm:inline">Agregar al Carrito</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </div>
      </div>

      {/* Estilos para scrollbar personalizado (opcional) */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default CardProduct;