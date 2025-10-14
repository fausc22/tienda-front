import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { IoMdClose, IoMdAdd, IoMdRemove } from 'react-icons/io';
import { useProducts } from '../../hooks/useProducts';
import toast from 'react-hot-toast';

const LiquidacionModal = ({ 
  isOpen, 
  onClose, 
  onProcederPago,
  onAddToCart 
}) => {
  const { products: ofertas, loading } = useProducts('/store/articulosLI');
  const [productosLimitados, setProductosLimitados] = useState([]);
  const [cantidades, setCantidades] = useState({});

  useEffect(() => {
    if (ofertas && ofertas.length > 0) {
      const limitados = ofertas.slice(0, 6);
      setProductosLimitados(limitados);
      
      const cantidadesIniciales = {};
      limitados.forEach((producto, index) => {
        cantidadesIniciales[index] = 1;
      });
      setCantidades(cantidadesIniciales);
    }
  }, [ofertas]);

  const handleCantidadChange = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    if (nuevaCantidad > 30) {
      toast.error('Cantidad máxima: 30 unidades');
      return;
    }
    
    setCantidades(prev => ({
      ...prev,
      [index]: nuevaCantidad
    }));
  };

  const handleAgregarProducto = (producto, index) => {
    const cantidad = cantidades[index] || 1;
    
    onAddToCart({
      name: producto.art_desc_vta,
      price: parseFloat(producto.PRECIO_DESC || producto.PRECIO),
      imageUrl: producto.CODIGO_BARRA,
      quantity: cantidad,
      cod_interno: producto.COD_INTERNO || producto.cod_interno
    });

    toast.success(`${cantidad}x ${producto.art_desc_vta} agregado${cantidad > 1 ? 's' : ''}`, {
      duration: 1500,
      icon: '🔥'
    });

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const calcularSubtotal = (producto, index) => {
    const precio = parseFloat(producto.PRECIO_DESC || producto.PRECIO);
    const cantidad = cantidades[index] || 1;
    return (precio * cantidad).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header FIJO */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 md:p-6 rounded-t-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoMdClose className="text-white text-xl md:text-2xl" />
          </button>

          <div className="text-center text-white">
            <div className="text-4xl md:text-5xl mb-2 md:mb-3">🔥</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
              ¡ÚLTIMA OPORTUNIDAD!
            </h2>
            <p className="text-base md:text-lg opacity-90">
              Artículos en Liquidación
            </p>
          </div>
        </div>

        {/* Contenido SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando ofertas...</p>
            </div>
          ) : productosLimitados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No hay ofertas disponibles en este momento</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                {productosLimitados.map((producto, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-200 rounded-xl p-2 md:p-3 hover:border-orange-400 hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Imagen */}
                    <div className="relative mb-2 bg-gray-50 rounded-lg overflow-hidden aspect-square">
                      <img
                        src={`https://vps-5234411-x.dattaweb.com/api/images/products/${producto.CODIGO_BARRA}.png`}
                        alt={producto.art_desc_vta}
                        className="w-full h-full object-contain p-1 md:p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
                        }}
                      />
                      
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                        OFERTA
                      </div>
                    </div>

                    {/* Nombre del producto */}
                    <h3 className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2rem] md:min-h-[2.5rem]">
                      {producto.art_desc_vta}
                    </h3>

                    {/* Precio unitario */}
                    <div className="mb-2">
                      <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Precio unitario:</p>
                      <span className="text-base md:text-lg font-bold text-green-600">
                        ${parseFloat(producto.PRECIO_DESC || producto.PRECIO).toFixed(2)}
                      </span>
                    </div>

                    {/* Controles de cantidad */}
                    <div className="mb-2 bg-gray-50 rounded-lg p-2">
                      <label className="text-[10px] md:text-xs text-gray-600 mb-1 block">Cantidad:</label>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCantidadChange(index, (cantidades[index] || 1) - 1)}
                          disabled={(cantidades[index] || 1) <= 1}
                          className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <IoMdRemove className="text-gray-700 text-sm" />
                        </button>
                        
                        <span className="w-8 text-center font-bold text-base md:text-lg">
                          {cantidades[index] || 1}
                        </span>
                        
                        <button
                          onClick={() => handleCantidadChange(index, (cantidades[index] || 1) + 1)}
                          disabled={(cantidades[index] || 1) >= 30}
                          className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                        >
                          <IoMdAdd className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="mb-2 text-center">
                      <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Subtotal:</p>
                      <span className="text-lg md:text-xl font-bold text-blue-600">
                        ${calcularSubtotal(producto, index)}
                      </span>
                    </div>

                    {/* Botón agregar */}
                    <button
                      onClick={() => handleAgregarProducto(producto, index)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 md:py-2.5 px-2 md:px-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 transform hover:scale-105 text-xs md:text-sm"
                    >
                      <IoMdAdd className="text-base md:text-lg" />
                      Agregar
                    </button>
                  </div>
                ))}
              </div>

              {/* Nota informativa */}
              <div className="bg-orange-50 border-l-4 border-orange-400 p-3 md:p-4 rounded-r-lg">
                <p className="text-orange-800 text-xs md:text-sm">
                  <strong>💡 Consejo:</strong> Estos productos están en liquidación por tiempo limitado. 
                  ¡Aprovecha ahora o podrían agotarse!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer FIJO */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onProcederPago}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
          >
            No gracias, PROCEDER AL PAGO 
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiquidacionModal;