import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { IoMailOutline } from 'react-icons/io5';
import { FaLocationDot } from 'react-icons/fa6';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import apiClient from '../config/api';

const Confirmation = () => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { config } = useConfig();
  const { dispatch } = useCart();

  useEffect(() => {
    const processPedido = async () => {
      try {
        const pedidoStored = localStorage.getItem('pedido');
        if (!pedidoStored) {
          setError('No se encontró información del pedido');
          setLoading(false);
          return;
        }

        const pedidoData = JSON.parse(pedidoStored);
        setPedido(pedidoData);

        if (config && pedidoData) {
          // Enviar email
          await enviarEmail(pedidoData);
          
          // Insertar pedido en la base de datos
          await insertarPedidoBaseDatos(pedidoData);
          
          // Limpiar localStorage
          localStorage.removeItem('pedido');
          localStorage.removeItem('cart');
          
          // Limpiar carrito del contexto
          dispatch({ type: 'CLEAR_CART' });
          
          console.log('Pedido procesado exitosamente');
        }
      } catch (error) {
        console.error('Error procesando el pedido:', error);
        setError('Error procesando el pedido');
      } finally {
        setLoading(false);
      }
    };

    if (config) {
      processPedido();
    }
  }, [config, dispatch]);

  const enviarEmail = async (pedido) => {
    try {
      const productosParaEmail = pedido.productos.map(producto => ({
        name: producto.nombre_producto,
        quantity: producto.cantidad,
        price: producto.precio
      }));

      await apiClient.post('/store/mailPedidoRealizado', {
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
      
      console.log('Correo enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  };

  const insertarPedidoBaseDatos = async (pedido) => {
    try {
      await apiClient.post('/store/NuevoPedido', {
        cliente: pedido.cliente,
        direccion_cliente: pedido.direccion_cliente,
        telefono_cliente: pedido.telefono_cliente,
        email_cliente: pedido.email_cliente,
        cantidad_productos: pedido.productos.length,
        monto_total: pedido.monto_total,
        costo_envio: pedido.costoEnvio,
        medio_pago: pedido.medio_pago,
        estado: 'Pendiente',
        notas_local: pedido.notas_local,
        productos: pedido.productos
      });
      
      console.log('Pedido insertado correctamente en la base de datos');
    } catch (error) {
      console.error('Error al insertar el pedido en la base de datos:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando tu pedido...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'No se pudo procesar tu pedido'}</p>
            <Link href="/">
              <Button color="primary">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

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
        <title>PEDIDO CONFIRMADO - {config?.storeName || 'TIENDA'}</title>
        <meta name="description" content="Tu pedido ha sido confirmado exitosamente" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-600 mb-4">
              ¡PEDIDO REALIZADO CON ÉXITO!
            </h1>
            <h2 className="text-2xl text-blue-600 mb-2">
              {config?.storeName || 'TIENDA'}
            </h2>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* Success Message */}
            <div className="bg-green-50 border-b border-green-200 p-6">
              <p className="text-lg text-green-800 text-center">
                {pedido.cliente ? `Gracias ${pedido.cliente}` : 'Gracias'} por elegirnos! 
                En tu email recibirás toda la información y el seguimiento de tu pedido.
              </p>
            </div>

            {/* Order Details */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-purple-600 text-center mb-6">
                DETALLES DEL PEDIDO
              </h3>

              {/* Products Table */}
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b">
                        Precio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pedido.productos.map((producto, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.nombre_producto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${producto.precio}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span className="font-semibold">Subtotal:</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Costo de Envío:</span>
                    <span>${costoEnvio.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${totalFinal}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Método de Pago:</span>
                    <span>{pedido.medio_pago || 'EFECTIVO'}</span>
                  </div>
                </div>
              </div>

              {/* Back to Store Button */}
              <div className="text-center mb-8">
                <Link href="/">
                  <Button
                    color="success"
                    size="lg"
                    className="px-8 py-3 text-lg font-semibold"
                  >
                    VOLVER A LA TIENDA
                  </Button>
                </Link>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-100 rounded-lg p-6">
                <h4 className="text-lg font-bold text-center text-gray-700 mb-4">
                  Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {config?.storeInstagram && (
                    <div className="flex items-center gap-2">
                      <FaInstagram className="text-pink-500" />
                      <span>{config.storeInstagram}</span>
                    </div>
                  )}
                  
                  {config?.storeEmail && (
                    <div className="flex items-center gap-2">
                      <IoMailOutline className="text-blue-500" />
                      <span>{config.storeEmail}</span>
                    </div>
                  )}
                  
                  {config?.storePhone && (
                    <div className="flex items-center gap-2">
                      <FaWhatsapp className="text-green-500" />
                      <span>{config.storePhone}</span>
                    </div>
                  )}
                  
                  {config?.storeAddress && (
                    <div className="flex items-center gap-2">
                      <FaLocationDot className="text-red-500" />
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
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