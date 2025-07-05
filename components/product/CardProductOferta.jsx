import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { IoMdAdd, IoMdRemove } from 'react-icons/io';
import { useCart } from '../../context/CartContext';
import apiClient, { getApiBaseURL } from '../../config/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../../hooks/useProducts';

const CardProductOferta = ({ 
  name, 
  originalPrice,    // PRECIO - precio original
  offerPrice,       // PRECIO_DESC - precio de oferta
  imageUrl, 
  codigoBarra,
  stock = 0
}) => {
  const [quantity, setQuantity] = useState(0);
  const [finalImageUrl, setFinalImageUrl] = useState(`${getApiBaseURL()}/images/placeholder.png`);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { dispatch } = useCart();

  // Formatear los precios
  const formattedOriginalPrice = formatPrice(originalPrice);
  const formattedOfferPrice = formatPrice(offerPrice);
  const numericOfferPrice = Math.round(parseFloat(offerPrice)); // Para cálculos del carrito

  // Calcular porcentaje de descuento
  const discountPercentage = originalPrice && offerPrice 
    ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    : 0;

  useEffect(() => {
    const getProductImage = async () => {
      if (!imageUrl && !codigoBarra) {
        const placeholderUrl = `${getApiBaseURL()}/images/placeholder.png`;
        setFinalImageUrl(placeholderUrl);
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      setImageError(false);

      try {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('🖼️ CardProductOferta: Obteniendo imagen para', imageUrl || codigoBarra);
        }

        // Intentar con imageUrl si está disponible, sino con código de barra
        const imageIdentifier = imageUrl || codigoBarra;
        const response = await apiClient.get(`/store/image/${imageIdentifier}`);
        
        if (response.data.success) {
          setFinalImageUrl(response.data.imageUrl);
          
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('✅ CardProductOferta: Imagen obtenida:', response.data.source, response.data.imageUrl);
          }
        } else {
          throw new Error('Failed to get image from backend');
        }
        
      } catch (error) {
        console.error('❌ CardProductOferta: Error getting product image:', error);
        const placeholderUrl = `${getApiBaseURL()}/images/placeholder.png`;
        setFinalImageUrl(placeholderUrl);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    getProductImage();
  }, [imageUrl, codigoBarra]);

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
        price: numericOfferPrice, // Usar precio de oferta para el carrito
        imageUrl: imageUrl || codigoBarra,
        quantity,
        isOffer: true, // Marcar como oferta para el carrito
        originalPrice: Math.round(parseFloat(originalPrice))
      }
    });

    toast.success('¡Oferta agregada al carrito!', {
      duration: 2000,
      position: 'top-right',
      style: {
        fontSize: '14px',
        padding: '8px 12px',
        background: '#10B981',
        color: 'white'
      },
    });

    setQuantity(0);
  };

  // Calcular total con precio de oferta
  const total = Math.round(numericOfferPrice * quantity);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-2 sm:p-3 md:p-4 flex flex-col h-full group relative overflow-hidden">
      
      {/* Badge de oferta */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
            -{discountPercentage}%
          </div>
        </div>
      )}

      {/* Badge de stock bajo (opcional) */}
      {stock > 0 && stock <= 5 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
            ¡Últimas {stock}!
          </div>
        </div>
      )}

      {/* Contenedor de imagen */}
      <div className="w-full h-24 sm:h-28 md:h-32 lg:h-36 mb-2 sm:mb-3 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden relative">
        
        {/* Loading state */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
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
            const placeholderUrl = `${getApiBaseURL()}/images/placeholder.png`;
            if (e.target.src !== placeholderUrl) {
              e.target.src = placeholderUrl;
              setImageError(true);
            }
          }}
        />
        
        {/* Indicador de error de imagen en modo debug */}
        {imageError && process.env.NEXT_PUBLIC_DEBUG === 'true' && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
            ⚠️
          </div>
        )}

        {/* Overlay de oferta en hover */}
        <div className="absolute inset-0 bg-red-500 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-red-600 font-bold text-xs bg-white px-2 py-1 rounded-full shadow-md">
              ¡OFERTA!
            </span>
          </div>
        </div>
      </div>

      {/* Información del producto */}
      <div className="flex flex-col flex-grow space-y-1 sm:space-y-2">
        
        {/* Nombre del producto */}
        <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-800 dark:text-white line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem]">
          {name}
        </h3>

        {/* Precios - Diseño especial para ofertas */}
        <div className="flex flex-col gap-1 bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-100 dark:border-red-800">
          {/* Precio original tachado */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Antes:</span>
            <span className="text-sm text-gray-500 line-through font-medium">
              ${formattedOriginalPrice}
            </span>
          </div>
          
          {/* Precio de oferta destacado */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-600">¡Ahora!</span>
            <span className="text-lg sm:text-xl font-bold text-red-600">
              ${formattedOfferPrice}
            </span>
          </div>

          {/* Ahorro */}
          {discountPercentage > 0 && (
            <div className="text-center">
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Ahorras ${(originalPrice - offerPrice).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        

        {/* Controles de cantidad */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={handleDecrease}
            disabled={quantity === 0}
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 min-w-0 text-xs border-red-200 hover:bg-red-50"
          >
            <IoMdRemove className="text-xs sm:text-sm text-red-600" />
          </Button>
          
          <span className="w-6 sm:w-8 text-center font-semibold text-xs sm:text-sm bg-red-50 px-2 py-1 rounded">
            {quantity}
          </span>
          
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={handleIncrease}
            disabled={stock > 0 && quantity >= stock}
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 min-w-0 text-xs border-red-200 hover:bg-red-50"
          >
            <IoMdAdd className="text-xs sm:text-sm text-red-600" />
          </Button>
        </div>

        {/* Total */}
        {quantity > 0 && (
          <div className="text-center py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
            <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">
              Total: ${total.toFixed(2)}
            </p>
            {/* Comparación con precio original */}
            <p className="text-xs text-gray-500">
              (Sin oferta: ${(originalPrice * quantity).toFixed(2)})
            </p>
          </div>
        )}

        {/* Botón agregar - Estilo especial para ofertas */}
        <div className="mt-auto pt-1 sm:pt-2">
          <Button
            fullWidth
            color="danger"
            onClick={handleAddToCart}
            disabled={quantity === 0 || imageLoading || (stock > 0 && quantity > stock)}
            className="font-medium text-xs sm:text-sm h-7 sm:h-8 md:h-9 px-2 bg-red-600 hover:bg-red-700 shadow-md"
            size="sm"
          >
            {/* Texto responsive */}
            <span className="block sm:hidden">🔥 Agregar</span>
            <span className="hidden sm:block">Agregar al carrito</span>
          </Button>

        </div>

        
      </div>
    </div>
  );
};

export default CardProductOferta;