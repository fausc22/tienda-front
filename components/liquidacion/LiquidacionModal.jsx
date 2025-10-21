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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* ============================================ */}
        {/* HEADER FIJO - Optimizado */}
        {/* ============================================ */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-3 sm:p-4 md:p-5 lg:p-6 rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoMdClose className="text-white text-lg sm:text-xl md:text-2xl" />
          </button>

          <div className="text-center text-white">
            <div className="text-3xl sm:text-4xl md:text-5xl mb-1.5 sm:mb-2 md:mb-3">🔥</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-1.5 md:mb-2">
              ¡ÚLTIMA OPORTUNIDAD!
            </h2>
            <p className="text-sm sm:text-base md:text-lg opacity-90">
              Artículos en Liquidación
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* CONTENIDO SCROLLEABLE - Grid Responsive */}
        {/* ============================================ */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-10 md:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Cargando ofertas...</p>
            </div>
          ) : productosLimitados.length === 0 ? (
            <div className="text-center py-8 sm:py-10 md:py-12">
              <p className="text-gray-600 text-base sm:text-lg">No hay ofertas disponibles en este momento</p>
            </div>
          ) : (
            <>
              {/* Grid adaptativo según resolución */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5">
                {productosLimitados.map((producto, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 hover:border-orange-400 hover:shadow-lg transition-all duration-300 group flex flex-col h-full max-h-[520px] md:max-h-[480px] lg:max-h-[500px]"
                  >
                    {/* ============================================ */}
                    {/* IMAGEN - Responsive */}
                    {/* ============================================ */}
                    <div className="relative mb-2 bg-gray-50 rounded-md sm:rounded-lg overflow-hidden aspect-square">
                      <img
                        src={`https://vps-5234411-x.dattaweb.com/api/images/products/${producto.CODIGO_BARRA}.png`}
                        alt={producto.art_desc_vta}
                        className="w-full h-full object-contain p-1 sm:p-1.5 md:p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
                        }}
                      />
                      
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 rounded-full shadow-sm">
                        OFERTA
                      </div>
                    </div>

                    {/* ============================================ */}
                    {/* NOMBRE - Line clamp optimizado + altura fija */}
                    {/* ============================================ */}
                    <h3 className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900 line-clamp-3 mb-1.5 sm:mb-2 h-[2.8rem] sm:h-[3rem] md:h-[3.5rem] leading-tight overflow-hidden">
                      {producto.art_desc_vta}
                    </h3>

                    {/* ============================================ */}
                    {/* PRECIO UNITARIO - Compacto */}
                    {/* ============================================ */}
                    <div className="mb-1.5 sm:mb-2">
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mb-0.5">Precio unitario:</p>
                      <span className="text-sm sm:text-base md:text-lg font-bold text-green-600">
                        ${parseFloat(producto.PRECIO_DESC || producto.PRECIO).toFixed(2)}
                      </span>
                    </div>

                    {/* ============================================ */}
                    {/* CONTROLES DE CANTIDAD - Ajustados */}
                    {/* ============================================ */}
                    <div className="mb-1.5 sm:mb-2 bg-gray-50 rounded-md sm:rounded-lg p-1.5 sm:p-2">
                      <label className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 mb-1 block font-medium">Cantidad:</label>
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleCantidadChange(index, (cantidades[index] || 1) - 1)}
                          disabled={(cantidades[index] || 1) <= 1}
                          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <IoMdRemove className="text-gray-700 text-xs sm:text-sm" />
                        </button>
                        
                        <span className="w-6 sm:w-7 md:w-8 text-center font-bold text-sm sm:text-base md:text-lg">
                          {cantidades[index] || 1}
                        </span>
                        
                        <button
                          onClick={() => handleCantidadChange(index, (cantidades[index] || 1) + 1)}
                          disabled={(cantidades[index] || 1) >= 30}
                          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
                        >
                          <IoMdAdd className="text-xs sm:text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* ============================================ */}
                    {/* SUBTOTAL - Destacado */}
                    {/* ============================================ */}
                    <div className="mb-2 sm:mb-2.5 text-center bg-blue-50 rounded-md py-1 sm:py-1.5">
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mb-0.5">Subtotal:</p>
                      <span className="text-base sm:text-lg md:text-xl font-bold text-blue-600">
                        ${calcularSubtotal(producto, index)}
                      </span>
                    </div>

                    {/* ============================================ */}
                    {/* BOTÓN AGREGAR - Siempre visible */}
                    {/* ============================================ */}
                    <button
                      onClick={() => handleAgregarProducto(producto, index)}
                      className="w-full mt-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-2 rounded-md sm:rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 transition-all duration-300 transform hover:scale-[1.02] text-[11px] sm:text-xs md:text-sm shadow-md hover:shadow-lg"
                    >
                      <IoMdAdd className="text-sm sm:text-base md:text-lg flex-shrink-0" />
                      <span>Agregar</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* ============================================ */}
              {/* NOTA INFORMATIVA - Responsive */}
              {/* ============================================ */}
              <div className="bg-orange-50 border-l-4 border-orange-400 p-2.5 sm:p-3 md:p-4 rounded-r-lg">
                <p className="text-orange-800 text-[11px] sm:text-xs md:text-sm leading-relaxed">
                  <strong>💡 Consejo:</strong> Estos productos están en liquidación por tiempo limitado. 
                  ¡Aprovecha ahora o podrían agotarse!
                </p>
              </div>
            </>
          )}
        </div>

        {/* ============================================ */}
        {/* FOOTER FIJO - Botón subrayado */}
        {/* ============================================ */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl sm:rounded-b-2xl flex-shrink-0">
          <button
            onClick={onProcederPago}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 sm:py-2.5 transition-colors text-sm sm:text-base md:text-lg underline decoration-2 underline-offset-4 hover:decoration-gray-800"
          >
            No gracias, PROCEDER AL PAGO →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiquidacionModal;