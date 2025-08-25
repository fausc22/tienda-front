import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { VscError } from 'react-icons/vsc';
import { IoMdAdd, IoMdRemove, IoMdTrash } from 'react-icons/io';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { useProducts, useRelatedProducts } from '../hooks/useProducts';
import CardProduct from '../components/product/CardProduct';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Section from '../components/common/Section';
import toast from 'react-hot-toast';

// Componente para tabla en desktop
function TablaDesktop({ 
  items, 
  handleQuantityChange, 
  handleRemoveItem 
}) {
  return (
    <div className="hidden lg:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-4 border-b border-gray-300 text-left text-gray-700 font-bold text-lg" style={{width: '40%'}}>
              Producto
            </th>
            <th className="p-4 border-b border-gray-300 text-center text-gray-700 font-bold text-lg" style={{width: '15%'}}>
              Precio
            </th>
            <th className="p-4 border-b border-gray-300 text-center text-gray-700 font-bold text-lg" style={{width: '20%'}}>
              Cantidad
            </th>
            <th className="p-4 border-b border-gray-300 text-center text-gray-700 font-bold text-lg" style={{width: '15%'}}>
              Subtotal
            </th>
            <th className="p-4 border-b border-gray-300 text-center text-gray-700 font-bold text-lg" style={{width: '10%'}}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://www.rsoftware.com.ar/imgart/${item.imageUrl}.png`}
                      alt={item.name}
                      className="w-16 h-16 object-contain bg-gray-50 rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
                      }}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-lg font-semibold text-gray-900">
                    ${item.price.toFixed(2)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      <IoMdRemove className="text-gray-700" />
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= 30}
                      className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                    >
                      <IoMdAdd />
                    </button>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-lg font-bold text-green-600">
                    ${item.total.toFixed(2)}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar producto"
                  >
                    <IoMdTrash className="text-xl" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-6xl">🛒</div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tu carrito está vacío</h3>
                    <p className="text-gray-400">Agrega productos para comenzar tu pedido</p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Componente para cards en móvil
function CardsMovil({ 
  items, 
  handleQuantityChange, 
  handleRemoveItem 
}) {
  return (
    <div className="lg:hidden">
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              {/* Header de la card */}
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={`https://www.rsoftware.com.ar/imgart/${item.imageUrl}.png`}
                  alt={item.name}
                  className="w-20 h-20 object-contain bg-gray-50 rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-2 leading-tight mb-2">
                    {item.name}
                  </h3>
                  <div className="text-lg font-semibold text-blue-600">
                    ${item.price.toFixed(2)} <span className="text-sm text-gray-500 font-normal">c/u</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Eliminar producto"
                >
                  <IoMdTrash className="text-xl" />
                </button>
              </div>

              {/* Controles de cantidad */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex flex-col gap-3">
                  {/* Fila de controles de cantidad */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Cantidad:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors border border-gray-300"
                      >
                        <IoMdRemove className="text-gray-700 text-lg" />
                      </button>
                      <span className="w-12 text-center font-bold text-xl">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 30}
                        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                      >
                        <IoMdAdd className="text-lg" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Fila del subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl">🛒</div>
            <div>
              <h3 className="text-lg font-medium mb-2">Tu carrito está vacío</h3>
              <p className="text-gray-500 mb-4">Agrega productos para comenzar tu pedido</p>
              <Link href="/productos">
                <Button color="primary" className="mt-2">
                  Ver Productos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Checkout = ({ onAddToCart }) => {
  const { items, totalPrice, dispatch } = useCart();
  const { config } = useConfig();
  const { products: relatedProducts, loading: loadingRelated, error: errorRelated } = useRelatedProducts(items);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
 // Debug mejorado
  useEffect(() => {
    console.log('🛒 Items del carrito enviados al backend:', items);
    console.log('🔗 Productos relacionados recibidos:', relatedProducts);
    console.log('📊 Cantidad:', relatedProducts?.length || 0);
  }, [items, relatedProducts]);
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
        <link rel="icon" href="https://vps-5234411-x.dattaweb.com/api/images/favicon.ico" />
        <meta name="description" content="Revisa tu carrito de compras" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center lg:text-left">
              Tu Carrito de Compras
            </h1>
            <div className="w-16 sm:w-20 md:w-24 h-0.5 bg-blue-600 mx-auto lg:mx-0 mb-6"></div>
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Columna principal - Lista de productos */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header de la sección */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Productos en tu carrito ({items.length})
                  </h2>
                </div>

                {/* Contenido de la tabla/cards */}
                <div className="p-4 sm:p-6">
                  {/* Tabla para desktop */}
                  <TablaDesktop
                    items={items}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />

                  {/* Cards para móvil */}
                  <CardsMovil
                    items={items}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />
                </div>
              </div>
            </div>

            {/* Columna lateral - Resumen y acciones */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20">
                {/* Resumen del pedido */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resumen del pedido
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Productos ({items.length})</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Envío</span>
                      <span className="text-green-600">Se calcula en el siguiente paso</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-4 sm:p-6 space-y-3">
                  <Link 
                    href="/pago"
                    className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      items.length === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                    style={{ pointerEvents: items.length === 0 ? 'none' : 'auto' }}
                  >
                    {items.length === 0 ? 'Carrito vacío' : 'Proceder al pago'}
                  </Link>
                  
                  <Link 
                    href="/productos"
                    className="block w-full text-center py-3 px-4 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold transition-all duration-300"
                  >
                    Seguir comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Productos Relacionados */}
          {items.length > 0 && (
            <Section title="Productos Relacionados">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4">
                {relatedProducts.slice(0, 12).map((product, index) => (
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
              <div className="flex justify-center mt-6 sm:mt-8">
                <Link 
                  href="/productos"
                  className="bg-transparent text-blue-600 border border-blue-600 py-2 px-6 sm:py-3 sm:px-8 rounded-lg hover:text-white hover:bg-blue-600 transition-all duration-300 font-medium"
                >
                  Ver más productos
                </Link>
              </div>
            </Section>
          )}

          <WhatsAppButton />
        </div>

        {/* Modal de confirmación */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🗑️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Eliminar producto?
                </h3>
                <p className="text-gray-600 text-sm">
                  Esta acción no se puede deshacer
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={confirmRemove}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={cancelRemove}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancelar
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