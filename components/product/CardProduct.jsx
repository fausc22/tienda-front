import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { IoMdAdd, IoMdRemove } from 'react-icons/io';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const CardProduct = ({ name, price, imageUrl, originalPrice }) => {
  const [quantity, setQuantity] = useState(0);
  const [finalImageUrl, setFinalImageUrl] = useState('/images/placeholder.png');
  const { dispatch } = useCart();

  useEffect(() => {
    // Lógica para determinar la imagen (local vs servidor)
    const checkImage = async () => {
      try {
        const serverImageUrl = `https://www.rsoftware.com.ar/imgart/${imageUrl}.png`;
        const img = new Image();
        img.onload = () => setFinalImageUrl(serverImageUrl);
        img.onerror = () => setFinalImageUrl('/images/placeholder.png');
        img.src = serverImageUrl;
      } catch (error) {
        setFinalImageUrl('/images/placeholder.png');
      }
    };

    if (imageUrl) {
      checkImage();
    }
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

    toast.success('Producto agregado al carrito', {
      duration: 2000,
      position: 'top-right',
    });

    setQuantity(0);
  };

  const total = price * quantity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      {/* Imagen */}
      <div className="w-full h-48 mb-4 flex items-center justify-center">
        <img
          src={finalImageUrl}
          alt={name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.target.src = '/images/placeholder.png';
          }}
        />
      </div>

      {/* Información del producto */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
          {name}
        </h3>

        {/* Precios */}
        <div className="flex items-center gap-2">
          {originalPrice && (
            <span className="text-sm text-red-500 line-through">
              ${originalPrice}
            </span>
          )}
          <span className="text-xl font-bold text-blue-600">
            ${price}
          </span>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-center gap-4 py-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={handleDecrease}
            disabled={quantity === 0}
          >
            <IoMdRemove />
          </Button>
          
          <span className="w-8 text-center font-semibold">
            {quantity}
          </span>
          
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={handleIncrease}
          >
            <IoMdAdd />
          </Button>
        </div>

        {/* Total y botón agregar */}
        {quantity > 0 && (
          <div className="text-center py-2">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Total: ${total.toFixed(2)}
            </p>
          </div>
        )}

        <Button
          fullWidth
          color="primary"
          onClick={handleAddToCart}
          disabled={quantity === 0}
          className="font-semibold"
        >
          Agregar al Carrito
        </Button>
      </div>
    </div>
  );
};

export default CardProduct;