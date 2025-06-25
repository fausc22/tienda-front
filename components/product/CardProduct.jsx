import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { IoMdAdd, IoMdRemove } from 'react-icons/io';
import { useCart } from '../../context/CartContext';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

const CardProduct = ({ name, price, imageUrl, originalPrice }) => {
  const [quantity, setQuantity] = useState(0);
  const [finalImageUrl, setFinalImageUrl] = useState(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/placeholder.png`);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { dispatch } = useCart();

  useEffect(() => {
    const getProductImage = async () => {
      if (!imageUrl) {
        const placeholderUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/placeholder.png`;
        setFinalImageUrl(placeholderUrl);
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      setImageError(false);

      try {
        // 🆕 LLAMADA ÚNICA AL BACKEND que maneja los 3 casos
        const response = await apiClient.get(`/store/image/${imageUrl}`);
        
        if (response.data.success) {
          setFinalImageUrl(response.data.imageUrl);
          
          
        } else {
          throw new Error('Failed to get image from backend');
        }
        
      } catch (error) {
        console.error('Error getting product image:', error);
        // Construir URL de placeholder usando la base URL de la API
        const placeholderUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/placeholder.png`;
        setFinalImageUrl(placeholderUrl);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    getProductImage();
  }, [imageUrl]);

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
        price: Number(price),
        imageUrl,
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

  const total = price * quantity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-2 sm:p-3 md:p-4 flex flex-col h-full group">
      
      {/* Contenedor de imagen */}
      <div className="w-full h-24 sm:h-28 md:h-32 lg:h-36 mb-2 sm:mb-3 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden relative">
        
        {/* Loading state */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Imagen principal */}
        <img
          src={finalImageUrl}
          alt={name}
          className={`max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            
            const placeholderUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/placeholder.png`;
            if (e.target.src !== placeholderUrl) {
              e.target.src = placeholderUrl;
              setImageError(true);
            }
          }}
        />
        
        
      </div>

      {/* Información del producto */}
      <div className="flex flex-col flex-grow space-y-1 sm:space-y-2">
        
        {/* Nombre del producto */}
        <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-800 dark:text-white line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem]">
          {name}
        </h3>

        {/* Precios */}
        <div className="flex flex-col gap-0.5">
          {originalPrice && (
            <span className="text-xs text-red-500 line-through">
              ${originalPrice}
            </span>
          )}
          <span className="text-sm sm:text-base md:text-lg font-bold text-blue-600">
            ${price}
          </span>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-2">
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
          <div className="text-center py-0.5 sm:py-1">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total: ${total.toFixed(2)}
            </p>
          </div>
        )}

        {/* Botón agregar */}
        <div className="mt-auto pt-1 sm:pt-2">
          <Button
            fullWidth
            color="primary"
            onClick={handleAddToCart}
            disabled={quantity === 0 || imageLoading}
            className="font-medium text-xs sm:text-sm h-7 sm:h-8 md:h-9 px-2"
            size="sm"
          >
            <span className="hidden sm:inline">Agregar al Carrito</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CardProduct;