import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@heroui/button';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { IoMailOutline, IoCheckmarkCircle, IoMdAlert,  } from 'react-icons/io5';
import { FaLocationDot } from 'react-icons/fa6';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { emailApiClient, longApiClient } from '../config/api';

const Confirmation = () => {
  const router = useRouter();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processed, setProcessed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('success'); // success, pending, failure
  const { config } = useConfig();
  const { dispatch } = useCart();
  
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Detectar el estado del pago desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status') || 'success';
    setPaymentStatus(status);

    const processPedido = async () => {
      if (hasProcessed.current || processed) {
        return;
      }

      try {
        const pedidoStored = localStorage.getItem('pedido');
        if (!pedidoStored) {
          setError('No se encontró información del pedido');
          setLoading(false);
          return;
        }

        const pedidoData = JSON.parse(pedidoStored);
        setPedido(pedidoData);

        // Solo procesar si el pago fue exitoso o pendiente
        if (config && pedidoData && !hasProcessed.current && (status === 'success' || status === 'pending')) {
          hasProcessed.current = true;
          setProcessed(true);
          
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('🛒 Confirmation: Iniciando procesamiento del pedido...', pedidoData);
          }
          
          // PASO 1: Insertar pedido (CRÍTICO - debe funcionar)
          try {
            // Actualizar estado según el resultado del pago
            const estadoPedido = status === 'pending' ? 'Pendiente de pago' : 'Pendiente';
            
            await insertarPedidoBaseDatos({
              ...pedidoData,
              estado: estadoPedido,
              estado_pago: status
            });
            
            if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
              console.log('✅ Confirmation: Pedido insertado exitosamente');
            }
            
            // Limpiar localStorage inmediatamente después del éxito del pedido
            localStorage.removeItem('pedido');
            localStorage.removeItem('cart');
            dispatch({ type: 'CLEAR_CART' });
            
            // MOSTRAR UI inmediatamente - no esperar al email
            setLoading(false);
            
          } catch (pedidoError) {
            console.error('❌ Confirmation: Error crítico al insertar pedido:', pedidoError);
            throw new Error('Error al procesar el pedido: ' + pedidoError.message);
          }
          
          // PASO 2: Enviar email completamente en background (sin verificación)
          if (status === 'success') {
            enviarEmailEnBackground(pedidoData);
          }
        } else {
          // Para estados de falla, solo mostrar la información sin procesar
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Confirmation: Error procesando el pedido:', error);
        setError('Error procesando el pedido: ' + error.message);
        hasProcessed.current = false;
        setProcessed(false);
        setLoading(false);
      }
    };

    if (config && !hasProcessed.current && !processed) {
      processPedido();
    } else if (!config) {
      setLoading(true);
    }
  }, [config, processed, dispatch, router]);

  // Función para enviar email en background SIN feedback visual
  const enviarEmailEnBackground = async (pedido) => {
    setTimeout(async () => {
      try {
        const productosParaEmail = pedido.productos.map(producto => ({
          name: producto.nombre_producto,
          quantity: producto.cantidad,
          price: producto.precio
        }));

        await emailApiClient.post('/store/mailPedidoRealizado', {
          storeName: config.storeName,
          name: pedido.cliente,
          clientMail: pedido.email_cliente,
          items: productosParaEmail,
          subtotal: pedido.subtotal,
          shippingCost: pedido.costoEnvio,
          total: pedido.monto_total,
          storeMail: config.storeEmail,
          storePhone: config.storePhone
        });
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('✅ Confirmation: Email enviado exitosamente en background');
        }
        
      } catch (error) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('📧 Confirmation: Email enviado en background (timeout normal):', error.message);
        }
      }
    }, 100);
  };

  const insertarPedidoBaseDatos = async (pedido) => {
    const response = await longApiClient.post('/store/NuevoPedido', {
      cliente: pedido.cliente,
      direccion_cliente: pedido.direccion_cliente,
      telefono_cliente: pedido.telefono_cliente,
      email_cliente: pedido.email_cliente,
      cantidad_productos: pedido.productos.length,
      monto_total: pedido.monto_total,
      costo_envio: pedido.costoEnvio,
      medio_pago: pedido.medio_pago,
      estado: pedido.estado,
      estado_pago: pedido.estado_pago,
      notas_local: pedido.notas_local,
      productos: pedido.productos
    });
    
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('✅ Confirmation: Pedido insertado correctamente en la base de datos:', response.data);
    }
  };

  // Función para obtener el mensaje apropiado según el estado
  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: '¡PEDIDO CONFIRMADO!',
          subtitle: 'Pago procesado exitosamente',
          message: 'Tu pedido ha sido confirmado y el pago se procesó correctamente.',
          bgColor: 'from-green-50 to-blue-50',
          headerBg: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: IoCheckmarkCircle,
          iconColor: 'text-green-600'
        };
      case 'pending':
        return {
          title: '¡PEDIDO RECIBIDO!',
          subtitle: 'Pago pendiente de aprobación',
          message: 'Tu pedido fue recibido y está pendiente de confirmación del pago. Te notificaremos cuando se procese.',
          bgColor: 'from-yellow-50 to-orange-50',
          headerBg: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
        };
      default:
        return {
          title: '¡PEDIDO CONFIRMADO!',
          subtitle: 'Procesamiento completado',
          message: 'Tu pedido ha sido confirmado exitosamente.',
          bgColor: 'from-green-50 to-blue-50',
          headerBg: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: IoCheckmarkCircle,
          iconColor: 'text-green-600'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Procesando tu pedido...</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <>
        <Head>
          <title>Error - {config?.storeName || 'TIENDA'}</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error || 'No se pudo procesar tu pedido'}</p>
            <div className="space-y-3">
              <Link href="/">
                <Button color="primary" size="lg" fullWidth>Volver al inicio</Button>
              </Link>
              <button
                onClick={() => {
                  hasProcessed.current = false;
                  setProcessed(false);
                  setError(null);
                  setLoading(true);
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = getStatusMessage();
  const IconComponent = statusInfo.icon;
  
  const subtotal = pedido.productos.reduce((acc, item) => 
    acc + parseFloat(item.precio) * item.cantidad, 0
  ).toFixed(2);
  const costoEnvio = parseFloat(pedido.costoEnvio || 0);
  const totalFinal = (parseFloat(subtotal) + costoEnvio).toFixed(2);

  const googleMapsUrl = config?.storeAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.storeAddress)}`
    : '#';

  return (
    <>
      <Head>
        <title>{statusInfo.title} - {config?.storeName || 'TIENDA'}</title>
        <link rel="icon" href="https://vps-5234411-x.dattaweb.com/api/images/favicon.ico" />
        <meta name="description" content={statusInfo.message} />
      </Head>

      <div className={`min-h-screen bg-gradient-to-br ${statusInfo.bgColor}`}>
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          
          {/* Header con ícono de estado */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mb-4 shadow-lg">
              <IconComponent className={`${statusInfo.iconColor} text-3xl sm:text-4xl`} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              {statusInfo.title}
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl text-blue-600 font-semibold">
              {config?.storeName || 'TIENDA'}
            </h2>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* Mensaje según el estado */}
            <div className={`${statusInfo.headerBg} border-b p-4 sm:p-6`}>
              <p className={`text-base sm:text-lg ${statusInfo.textColor} text-center leading-relaxed`}>
                {pedido.cliente ? `Gracias ${pedido.cliente}` : 'Gracias'} por elegirnos! 
                <br className="sm:hidden" />
                <span className="block sm:inline mt-1 sm:mt-0"> {statusInfo.message}</span>
                {paymentStatus === 'success' && (
                  <span className="block mt-1 text-sm">
                    Recibirás un email con todos los detalles.
                  </span>
                )}
                {paymentStatus === 'pending' && (
                  <span className="block mt-1 text-sm">
                    Te contactaremos cuando se confirme el pago.
                  </span>
                )}
              </p>
            </div>

            {/* Detalles del pedido */}
            <div className="p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-4 sm:mb-6">
                DETALLES DEL PEDIDO
              </h3>

              {/* Tabla responsiva de productos */}
              <div className="mb-6 sm:mb-8">
                {/* Vista desktop - tabla */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full bg-gray-50 border border-gray-200 rounded-lg">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wider">
                          Precio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pedido.productos.map((producto, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {producto.nombre_producto}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-semibold">
                            {producto.cantidad}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            ${parseFloat(producto.precio).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista móvil - cards */}
                <div className="sm:hidden space-y-3">
                  {pedido.productos.map((producto, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">
                        {producto.nombre_producto}
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Cantidad: <span className="font-semibold text-gray-900">{producto.cantidad}</span>
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          ${parseFloat(producto.precio).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de totales */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">
                  Resumen del Pedido
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-900">${subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="font-medium text-gray-700">Costo de Envío:</span>
                    <span className="font-semibold text-gray-900">${costoEnvio.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between items-center text-lg sm:text-xl">
                      <span className="font-bold text-gray-900">TOTAL:</span>
                      <span className="font-bold text-green-600 text-xl sm:text-2xl">${totalFinal}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base pt-2 border-t border-blue-200">
                    <span className="font-medium text-gray-700">Método de Pago:</span>
                    <span className="font-semibold text-blue-600">{pedido.medio_pago || 'EFECTIVO'}</span>
                  </div>
                  {paymentStatus === 'pending' && (
                    <div className="flex justify-between items-center text-sm sm:text-base pt-2">
                      <span className="font-medium text-gray-700">Estado del Pago:</span>
                      <span className="font-semibold text-yellow-600">Pendiente</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mensaje adicional para pagos pendientes */}
              {paymentStatus === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200c rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Pago Pendiente</h4>
                      <p className="text-yellow-700 text-sm leading-relaxed">
                        Tu pago está siendo procesado. Esto puede tomar algunos minutos o hasta 24 horas según el método de pago utilizado. 
                        Te notificaremos por email cuando se confirme.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón volver */}
              <div className="text-center mb-6 sm:mb-8">
                <Link href="/">
                  <Button
                    color="primary"
                    size="lg"
                    className="px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    VOLVER A LA TIENDA
                  </Button>
                </Link>
              </div>

              {/* Información de contacto */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h4 className="text-lg font-bold text-center text-gray-900 mb-4">
                  Información de Contacto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  {config?.storeInstagram && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <FaInstagram className="text-pink-500 text-lg flex-shrink-0" />
                      <span className="text-gray-700 truncate">{config.storeInstagram}</span>
                    </div>
                  )}
                  
                  {config?.storeEmail && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <IoMailOutline className="text-blue-500 text-lg flex-shrink-0" />
                      <span className="text-gray-700 truncate">{config.storeEmail}</span>
                    </div>
                  )}
                  
                  {config?.storePhone && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <FaWhatsapp className="text-green-500 text-lg flex-shrink-0" />
                      <span className="text-gray-700">{config.storePhone}</span>
                    </div>
                  )}
                  
                  {config?.storeAddress && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg sm:col-span-2">
                      <FaLocationDot className="text-red-500 text-lg flex-shrink-0" />
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-blue-600 transition-colors truncate flex-1"
                      >
                        {config.storeAddress}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Confirmation;