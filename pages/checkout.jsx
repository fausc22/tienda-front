import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { VscError } from 'react-icons/vsc';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useProducts } from '../hooks/useProducts';
import CardProduct from '../components/product/CardProduct';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Section from '../components/common/Section';
import toast from 'react-hot-toast';

const Checkout = ({ onAddToCart }) => {
  const { items, totalPrice, dispatch } = useCart();
  const { config } = useConfig();
  const { products: relatedProducts } = useProducts('/store/articulosDEST');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setItemToDelete(id);
      setShowConfirmDialog(true);
      return;
    }

    if (newQuantity > 30) {
      toast.error('Cantidad máxima: 30 unidades');
      return;
    }

    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id, quantity: newQuantity }
    });
  };

  const handleRemoveItem = (id) => {
    setItemToDelete(id);
    setShowConfirmDialog(true);
  };

  const confirmRemove = () => {
    if (itemToDelete) {
      dispatch({
        type: 'REMOVE_ITEM',
        payload: itemToDelete
      });
      toast.success('Producto eliminado del carrito');
    }
    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  const cancelRemove = () => {
    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  return (
    <>
      <Head>
        <title>{config?.storeName ? `CARRITO - ${config.storeName}` : 'CARRITO - TIENDA'}</title>
        <meta name="description" content="Revisa tu carrito de compras" />
      </Head>

      <div className="w-full pt-16">
        <div className="w-full flex flex-col items-center">
          
          <Section title="Listado del pedido">
            <div className="flex flex-col w-4/5 justify-center sm:w-full">
              
              {/* Tabla - Environment Table */}
              <div className="w-full overflow-x-auto sm:px-2">
                <table className="w-full border-collapse mb-4 table-fixed text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border-b border-gray-300 text-left text-gray-600 font-bold bg-gray-100 whitespace-nowrap text-2xl text-center w-1/3 sm:text-sm sm:border-r sm:border-gray-300">
                        Producto
                      </th>
                      <th className="p-2 border-b border-gray-300 text-left text-gray-600 font-bold bg-gray-100 whitespace-nowrap text-2xl text-center w-1/4 sm:text-sm sm:border-r sm:border-gray-300">
                        Precio
                      </th>
                      <th className="p-2 border-b border-gray-300 text-left text-gray-600 font-bold bg-gray-100 whitespace-nowrap text-2xl text-center w-1/4 sm:text-sm sm:border-r sm:border-gray-300">
                        Cantidad
                      </th>
                      <th className="p-2 border-b border-gray-300 text-left text-gray-600 font-bold bg-gray-100 whitespace-nowrap text-2xl text-center w-1/3 sm:text-sm sm:border-r sm:border-gray-300">
                        Subtotal
                      </th>
                      <th className="p-2 border-b border-gray-300 text-left text-gray-600 font-bold bg-gray-100 whitespace-nowrap text-2xl text-center w-20 sm:text-sm">
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? (
                      items.map((item) => (
                        <tr key={item.id} className="text-gray-500 bg-transparent even:bg-gray-100">
                          <td className="p-2 border-b border-gray-300 text-xl text-center break-words sm:p-1 sm:text-sm sm:border-r sm:border-gray-300">
                            {item.name}
                          </td>
                          <td className="p-2 border-b border-gray-300 text-xl text-center break-words sm:p-1 sm:text-sm sm:border-r sm:border-gray-300">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="p-2 border-b border-gray-300 text-xl text-center break-words sm:p-1 sm:text-sm sm:border-r sm:border-gray-300">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 border-none rounded-full bg-blue-600 text-white text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="mx-2 text-base w-8 text-center select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= 30}
                                className="w-8 h-8 border-none rounded-full bg-blue-600 text-white text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2 border-b border-gray-300 text-xl text-center break-words sm:p-1 sm:text-sm sm:border-r sm:border-gray-300">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="p-2 border-b border-gray-300 text-xl text-center break-words sm:p-1 sm:text-sm">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="bg-transparent border-none text-red-500 cursor-pointer text-center text-xl"
                            >
                              <VscError />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-500">
                          NO HAY PRODUCTOS EN EL CARRITO.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Container Outside Table */}
              <div className="pt-2 w-full flex flex-col gap-5 items-end">
                <div className="text-right text-gray-600 font-bold text-lg">
                  Total: ${totalPrice.toFixed(2)}
                </div>
                <div className="flex w-full justify-end gap-2">
                  <Link 
                    href="/pago"
                    className={`px-3 py-2 text-base leading-6 text-white border border-blue-600 rounded transition-all duration-150 ease-in-out text-decoration-none ${
                      items.length === 0 
                        ? 'bg-gray-400 border-gray-400 cursor-not-allowed opacity-60' 
                        : 'bg-blue-600 hover:bg-blue-700 hover:border-blue-700 cursor-pointer'
                    }`}
                    style={{ pointerEvents: items.length === 0 ? 'none' : 'auto' }}
                  >
                    Pagar
                  </Link>
                  <Link 
                    href="/productos"
                    className="px-3 py-2 text-base leading-6 text-blue-600 bg-transparent border border-blue-600 rounded transition-all duration-150 ease-in-out hover:text-white hover:bg-blue-700 hover:border-blue-700 text-decoration-none"
                  >
                    Seguir comprando
                  </Link>
                </div>
              </div>
            </div>
          </Section>

          {/* Productos Relacionados */}
          <Section title="Productos Relacionados">
            <div className="flex flex-wrap justify-center w-full gap-12 sm:gap-2">
              {relatedProducts.slice(0, 8).map((product, index) => (
                <CardProduct
                  key={index}
                  name={product.art_desc_vta}
                  price={product.PRECIO}
                  imageUrl={product.CODIGO_BARRA}
                  onAddToCart={onAddToCart}
                  reloadOnAdd={true}
                />
              ))}
            </div>
            <Link 
              href="/productos"
              className="px-5 py-2 bg-blue-600 text-white text-center text-decoration-none border-none rounded cursor-pointer font-bold my-5 hover:bg-blue-700"
            >
              Ver más
            </Link>
          </Section>

          <WhatsAppButton />
        </div>

        {/* Modal de confirmación */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ¿Estás seguro que deseas eliminar este artículo?
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={confirmRemove}
                  className="flex-1 px-5 py-2 bg-blue-600 text-white border-none rounded cursor-pointer"
                >
                  Sí
                </button>
                <button
                  onClick={cancelRemove}
                  className="flex-1 px-5 py-2 bg-gray-500 text-white border-none rounded cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout;