import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@heroui/button';
import { CiCircleCheck } from 'react-icons/ci';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import apiClient from '../config/api';

const Pago = () => {
  const router = useRouter();
  const { items, totalPrice } = useCart();
  const { config } = useConfig();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryOption: '',
    address: '',
    isDepartment: false,
    departmentNumber: '',
    paymentMethod: '',
    localNote: ''
  });

  // Estados para manejo de envío
  const [shippingCost, setShippingCost] = useState(0);
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Estados de UI
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const total = parseFloat(subtotal.toFixed(2)) + parseFloat(shippingCost.toFixed(2));

  // Redireccionar si no hay productos
  useEffect(() => {
    if (items.length === 0) {
      router.push('/checkout');
    }
  }, [items, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Resetear errores
    setError('');
    setPaymentError('');

    // Lógica especial para cambios en delivery option
    if (name === 'deliveryOption') {
      setFormData(prev => ({ ...prev, paymentMethod: '' }));
      setShippingCost(0);
      setSelectedAddress(null);
    }
  };

  const handlePaymentMethodChange = (value) => {
    if (!formData.deliveryOption) {
      setPaymentError('Debe seleccionar una forma de entrega antes de elegir un método de pago.');
      return;
    }

    if (value === 'Efectivo' && formData.deliveryOption !== 'local') {
      setPaymentError('PARA PAGOS EN EFECTIVO DEBE SELECCIONAR RETIRO EN EL LOCAL');
      return;
    }

    setFormData(prev => ({ ...prev, paymentMethod: value }));
    setPaymentError('');
  };

  const calculateShipping = async () => {
    if (!formData.address.trim()) {
      setError('Por favor, ingresa una dirección válida.');
      return;
    }

    setIsCalculatingShipping(true);
    setError('');
    setAddressOptions([]);

    try {
      const response = await apiClient.post('/store/calculateShipping', { 
        address: formData.address 
      });
      
      if (response.data.results.length > 0) {
        setAddressOptions(response.data.results);
      } else {
        setError('No se encontró una dirección válida.');
      }
    } catch (error) {
      console.error('Error al calcular el costo de envío:', error);
      setError('No se pudo calcular el costo de envío. Verifica la dirección ingresada.');
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const selectAddress = (selected) => {
    setFormData(prev => ({ ...prev, address: selected.formatted }));
    setSelectedAddress(selected.formatted);
    setShippingCost(selected.shippingCost);
    setAddressOptions([]);
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Por favor, completa todos los campos requeridos.');
      return false;
    }

    if (formData.deliveryOption === 'delivery') {
      if (!selectedAddress || shippingCost === 0) {
        setError('Por favor, calcula el costo de envío con una dirección válida.');
        return false;
      }
      if (formData.isDepartment && !formData.departmentNumber.trim()) {
        setError('Por favor, ingresa el número de departamento.');
        return false;
      }
    }

    if (!formData.deliveryOption) {
      setError('Por favor, selecciona una opción de entrega.');
      return false;
    }

    if (!formData.paymentMethod) {
      setError('Por favor, selecciona un método de pago.');
      return false;
    }

    return true;
  };

  const handleConfirmOrder = () => {
    if (!validateForm()) return;

    const message = formData.paymentMethod === 'Efectivo' 
      ? 'Si la respuesta es SI, el pedido se confirmará y comenzará su proceso de preparación. Oprime NO para cancelar.'
      : 'Si la respuesta es SI, te redireccionaremos a la plataforma de MERCADO PAGO para terminar la compra, y solo se confirmará una vez recibido el pago. Oprime NO para cancelar.';
    
    setModalMessage(message);
    setShowConfirmModal(true);
  };

  const processOrder = async () => {
    try {
      const pedido = {
        cliente: formData.name,
        direccion_cliente: formData.deliveryOption === 'delivery' 
          ? `${selectedAddress}${formData.departmentNumber ? `, ${formData.departmentNumber}` : ''}` 
          : 'Retiro en local',
        telefono_cliente: formData.phone,
        email_cliente: formData.email,
        cantidad_productos: items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
        costoEnvio: shippingCost.toFixed(2),
        monto_total: total,
        medio_pago: formData.paymentMethod,
        estado: 'Pendiente',
        notas_local: formData.localNote.trim() || '-',
        productos: items.map(item => ({
          codigo_barra: item.imageUrl,
          nombre_producto: item.name,
          cantidad: item.quantity,
          precio: item.total.toFixed(2)
        }))
      };

      localStorage.setItem('pedido', JSON.stringify(pedido));

      if (formData.paymentMethod === 'Efectivo') {
        router.push('/confirmacion');
      } else if (formData.paymentMethod === 'MercadoPago') {
        const response = await apiClient.post('/store/create_preference', { total });
        window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?preference-id=${response.data.id}`;
      }
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      setError('No se pudo completar la operación.');
    }
  };

  if (items.length === 0) {
    return null; // El useEffect se encargará de redireccionar
  }

  return (
    <>
      <Head>
        <title>{config?.storeName ? `PAGO - ${config.storeName}` : 'PAGO - TIENDA'}</title>
        <meta name="description" content="Finaliza tu compra" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Steps */}
          <div className="flex justify-center items-center mb-8 space-x-8">
            <div className="flex items-center gap-2 text-gray-600">
              <CiCircleCheck className="text-green-500" />
              <span>Elegir productos</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CiCircleCheck className="text-green-500" />
              <span>Agregar al carrito</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <CiCircleCheck className="text-blue-600" />
              <span>Confirmar pedido</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Formulario */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Formulario de pago
              </h2>

              <div className="space-y-6">
                {/* Datos personales */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const regex = /^[0-9+]*$/;
                        if (regex.test(e.target.value)) {
                          handleInputChange(e);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Forma de entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Forma de entrega *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="delivery"
                        checked={formData.deliveryOption === 'delivery'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Envío por delivery</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="local"
                        checked={formData.deliveryOption === 'local'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Retiro en el local</span>
                    </label>
                  </div>
                </div>

                {/* Dirección (solo si es delivery) */}
                {formData.deliveryOption === 'delivery' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Ej: Chacabuco 635, Córdoba, Argentina"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          onClick={calculateShipping}
                          isLoading={isCalculatingShipping}
                          color="primary"
                          size="sm"
                        >
                          Calcular envío
                        </Button>
                      </div>
                      {shippingCost > 0 && (
                        <p className="mt-1 text-sm text-green-600">
                          Costo de envío: ${shippingCost.toFixed(2)}
                        </p>
                      )}
                      {addressOptions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Seleccione la dirección correcta:
                          </p>
                          <ul className="space-y-1">
                            {addressOptions.map((option, index) => (
                              <li
                                key={index}
                                onClick={() => selectAddress(option)}
                                className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {option.formatted}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ¿Es un departamento?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isDepartment"
                            value="true"
                            checked={formData.isDepartment === true}
                            onChange={(e) => setFormData(prev => ({ ...prev, isDepartment: true }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-900">Sí</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isDepartment"
                            value="false"
                            checked={formData.isDepartment === false}
                            onChange={(e) => setFormData(prev => ({ ...prev, isDepartment: false }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-900">No</span>
                        </label>
                      </div>
                    </div>

                    {formData.isDepartment && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Departamento *
                        </label>
                        <input
                          type="text"
                          name="departmentNumber"
                          value={formData.departmentNumber}
                          onChange={handleInputChange}
                          placeholder="Número de Departamento"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de pago *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Efectivo"
                        checked={formData.paymentMethod === 'Efectivo'}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        disabled={!formData.deliveryOption || formData.deliveryOption !== 'local'}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className={`ml-2 text-sm ${!formData.deliveryOption || formData.deliveryOption !== 'local' ? 'text-gray-400' : 'text-gray-900'}`}>
                        Efectivo
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="MercadoPago"
                        checked={formData.paymentMethod === 'MercadoPago'}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        disabled={!formData.deliveryOption}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className={`ml-2 text-sm ${!formData.deliveryOption ? 'text-gray-400' : 'text-gray-900'}`}>
                        Mercado Pago / Tarjeta de crédito/débito
                      </span>
                    </label>
                  </div>
                  {paymentError && (
                    <p className="mt-1 text-sm text-red-600">{paymentError}</p>
                  )}
                </div>

                {/* Nota para el local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nota para el local
                  </label>
                  <textarea
                    name="localNote"
                    value={formData.localNote}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Listado del pedido
              </h2>

              <div className="space-y-4 mb-6">
                <p className="text-gray-600">{items.length} items</p>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="h-16 w-16 flex-shrink-0">
                        <img
                          className="h-16 w-16 rounded-md object-contain"
                          src={`https://www.rsoftware.com.ar/imgart/${item.imageUrl}.png`}
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          ${item.total.toFixed(2)}
                        </h4>
                        <p className="text-sm text-gray-600 mb-1">
                          {item.name}
                        </p>
                        <span className="text-xs text-gray-500">
                          Cantidad: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleConfirmOrder}
                  disabled={!formData.paymentMethod}
                  color="primary"
                  size="lg"
                  fullWidth
                  className="font-semibold"
                >
                  Confirmar Pedido
                </Button>

                <Link href="/checkout">
                  <Button
                    variant="bordered"
                    size="lg"
                    fullWidth
                    color="danger"
                  >
                    Editar Carrito
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ¿Estás seguro que deseas confirmar el pedido?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {modalMessage}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowConfirmModal(false);
                    processOrder();
                  }}
                  color="primary"
                  className="flex-1"
                >
                  Sí
                </Button>
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="bordered"
                  className="flex-1"
                >
                  No
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Pago;