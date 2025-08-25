import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@heroui/button';
import { IoMdClose, IoMdAlert, IoMdRefresh } from 'react-icons/io';
import { FaWhatsapp } from 'react-icons/fa';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';

const PagoRechazado = () => {
  const router = useRouter();
  const { config } = useConfig();
  const { dispatch } = useCart();
  const [pedidoData, setPedidoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar recuperar los datos del pedido para permitir reintentar
    const pedidoStored = localStorage.getItem('pedido');
    if (pedidoStored) {
      try {
        const pedido = JSON.parse(pedidoStored);
        setPedidoData(pedido);
      } catch (error) {
        console.error('Error parsing pedido data:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleRetryPayment = () => {
    // Redirigir de vuelta a la página de pago para reintentar
    router.push('/pago');
  };

  const handleContactSupport = () => {
    if (config?.storePhone) {
      const message = encodeURIComponent(
        `Hola! Tuve un problema con mi pago en ${config.storeName}. ¿Pueden ayudarme?`
      );
      window.open(`https://wa.me/${config.storePhone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleClearAndStart = () => {
    // Limpiar todo y empezar de nuevo
    localStorage.removeItem('pedido');
    localStorage.removeItem('cart');
    dispatch({ type: 'CLEAR_CART' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>PAGO NO PROCESADO - {config?.storeName || 'TIENDA'}</title>
        <link rel="icon" href="https://vps-5234411-x.dattaweb.com/api/images/favicon.ico" />
        <meta name="description" content="Problema con el procesamiento del pago" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          
          {/* Header con ícono de error */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full mb-4">
              <IoMdClose className="text-red-600 text-3xl sm:text-4xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-2 sm:mb-4">
              PAGO NO PROCESADO
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl text-gray-700 font-semibold">
              {config?.storeName || 'TIENDA'}
            </h2>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* Mensaje principal */}
            <div className="bg-red-50 border-b border-red-200 p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <IoMdAlert className="text-red-500 text-2xl flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Tu pago no pudo ser procesado
                  </h3>
                  <p className="text-red-700 text-sm sm:text-base leading-relaxed">
                    No te preocupes, esto puede suceder por varios motivos como fondos insuficientes, 
                    problemas temporales con la tarjeta, o interrupciones en la conexión. 
                    Tu pedido no se ha perdido y puedes intentar nuevamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones de acción */}
            <div className="p-4 sm:p-6">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
                ¿Qué quieres hacer?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                
                {/* Opción 1: Reintentar pago */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                  <div className="text-center">
                    <IoMdRefresh className="text-blue-600 text-3xl mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">
                      Reintentar Pago
                    </h4>
                    <p className="text-blue-700 text-sm mb-4">
                      Vuelve a la página de pago con tus datos guardados
                    </p>
                    <Button
                      onClick={handleRetryPayment}
                      color="primary"
                      size="lg"
                      fullWidth
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Intentar Nuevamente
                    </Button>
                  </div>
                </div>

                {/* Opción 2: Contactar soporte */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                  <div className="text-center">
                    <FaWhatsapp className="text-green-600 text-3xl mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-green-800 mb-2">
                      Contactar por WhatsApp
                    </h4>
                    <p className="text-green-700 text-sm mb-4">
                      Contacta con nosotros para resolver el problema
                    </p>
                    <Button
                      onClick={handleContactSupport}
                      color="success"
                      size="lg"
                      fullWidth
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!config?.storePhone}
                    >
                      Contactar Soporte
                    </Button>
                  </div>
                </div>
              </div>

              {/* Resumen del pedido si está disponible */}
              {pedidoData && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
                    Tu pedido (guardado)
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Cliente:</span>
                      <span className="text-gray-900">{pedidoData.cliente}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Productos:</span>
                      <span className="text-gray-900">{pedidoData.cantidad_productos || pedidoData.productos?.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Subtotal:</span>
                      <span className="text-gray-900">${pedidoData.subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Envío:</span>
                      <span className="text-gray-900">${pedidoData.costoEnvio}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total:</span>
                        <span className="font-bold text-red-600 text-lg">${pedidoData.monto_total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">Causas comunes de rechazo:</h4>
                <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                  <li>Fondos insuficientes en la tarjeta</li>
                  <li>Tarjeta vencida o bloqueada</li>
                  <li>Límite de compras excedido</li>
                  <li>Datos de la tarjeta incorrectos</li>
                  <li>Problemas temporales del banco</li>
                </ul>
              </div>

              {/* Botón para empezar de nuevo */}
              <div className="text-center">
                <Button
                  onClick={handleClearAndStart}
                  variant="flat"
                  size="lg"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8"
                >
                  Empezar Nueva Compra
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PagoRechazado;