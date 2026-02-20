import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@heroui/button';
import { CiCircleCheck, CiLocationOn, CiCreditCard1, CiUser, CiPhone, CiMail } from 'react-icons/ci';
import { IoMdClose, IoMdCheckmarkCircle, IoMdAlert, IoMdTrash, IoMdPin, IoMdPricetag } from 'react-icons/io';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import SmartAddressInput from '../components/pago/SmartAddressInput';
import AddressMapPicker from '../components/pago/AddressMapPicker';
import apiClient, { getProductImageURL, getPlaceholderImageURL, getFaviconURL } from '../config/api';

// Componente para mostrar errores de validación
const ErrorMessage = ({ message, show }) => {
  if (!show) return null;
  
  return (
    <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
      <IoMdAlert className="text-lg flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// Componente para campos de input con validación
const InputField = ({ 
  label, 
  icon: Icon, 
  error, 
  required = false, 
  children 
}) => {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {Icon && <Icon className="text-lg text-gray-500" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <ErrorMessage message={error} show={!!error} />
    </div>
  );
};

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

  // Estados para manejo de envío (shippingCost se mantiene por compatibilidad con SmartAddressInput; el total viene del quote)
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [addressInputValue, setAddressInputValue] = useState('');
  // Fase 5: Quote como fuente de verdad
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [cuponInput, setCuponInput] = useState('');
  // Estados de UI
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [addressSource, setAddressSource] = useState(null);
  const [clearAddressTrigger, setClearAddressTrigger] = useState(0);
  const subtotalCart = items.reduce((acc, item) => acc + item.total, 0);
  const maxKm = parseFloat(config?.storeDeliveryMaxKm) || 0;
  const isAddressOutOfRange = selectedAddressData && maxKm > 0 && selectedAddressData.distance > maxKm;
  const showOutOfRangeMessage = (formData.deliveryOption === 'delivery' && errors.address && String(errors.address).includes('fuera de la zona')) || isAddressOutOfRange;
  const total = quote ? quote.total : (parseFloat(subtotalCart.toFixed(2)) + (formData.deliveryOption === 'local' ? 0 : shippingCost));

  // Redireccionar si no hay productos
  // Redireccionar si no hay productos (con delay para permitir hidratación)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length === 0) {
        router.push('/checkout');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [items, router]);

  // Fase 5: Obtener quote del backend (fuente de verdad para total)
  const fetchQuote = async () => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    const deliveryOption = formData.deliveryOption || 'delivery';
    const address = deliveryOption === 'local' ? '' : (formData.address?.trim() || selectedAddressData?.address || '');
    if (deliveryOption === 'delivery' && (!address || address.length < 5)) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const productos = items.map((item) => ({
        codigo_barra: item.codigo_barra || item.imageUrl,
        cod_interno: item.cod_interno || 0,
        cantidad: item.quantity,
        nombre_producto: item.name,
      }));
      const { data } = await apiClient.post('/store/pricing/quote', {
        productos,
        deliveryOption,
        address,
        cuponCodigo: cuponCodigo || undefined,
      });
      setQuote(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al calcular el total';
      const isOutOfRange = String(msg).includes('fuera de la zona');
      if (isOutOfRange) {
        setErrors(prev => ({ ...prev, address: msg }));
        setQuoteError(null);
      } else {
        setQuoteError(msg);
      }
      setQuote(null);
      if (cuponCodigo && !isOutOfRange) toast.error(msg);
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [
    items.length,
    items.map((i) => `${i.id}:${i.quantity}`).join('|'),
    formData.deliveryOption,
    (formData.deliveryOption === 'delivery' ? (formData.address || selectedAddressData?.address || '') : ''),
    cuponCodigo,
  ]);

  // Validaciones en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre es obligatorio';
        } else if (value.trim().length < 2) {
          newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        } else {
          delete newErrors.name;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = 'El email es obligatorio';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Ingresa un email válido';
        } else {
          delete newErrors.email;
        }
        break;

      case 'phone':
        const phoneRegex = /^[+]?[\d\s\-\(\)]{8,}$/;
        if (!value.trim()) {
          newErrors.phone = 'El teléfono es obligatorio';
        } else if (!phoneRegex.test(value)) {
          newErrors.phone = 'Ingresa un teléfono válido (min. 8 dígitos)';
        } else {
          delete newErrors.phone;
        }
        break;

      case 'address':
      if (formData.deliveryOption === 'delivery' && !value.trim()) {
        newErrors.address = 'La dirección es obligatoria para delivery';
      } else {
        delete newErrors.address;
      }
      break;

      case 'departmentNumber':
        if (formData.deliveryOption === 'delivery' && formData.isDepartment && !value.trim()) {
          newErrors.departmentNumber = 'El número de departamento es obligatorio';
        } else {
          delete newErrors.departmentNumber;
        }
        break;

      case 'deliveryOption':
        if (!value) {
          newErrors.deliveryOption = 'Selecciona una opción de entrega';
        } else {
          delete newErrors.deliveryOption;
        }
        break;

      case 'paymentMethod':
        if (!value) {
          newErrors.paymentMethod = 'Selecciona un método de pago';
        } else {
          delete newErrors.paymentMethod;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validar el campo
    validateField(name, newValue);

    // Lógica especial para cambios en delivery option
    if (name === 'deliveryOption') {
      setFormData(prev => ({ ...prev, paymentMethod: '' }));
      setSelectedAddressData(null);
      
      // Si selecciona "local", envío es 0
      if (newValue === 'local') {
        setShippingCost(0);
      } else {
        setShippingCost(0); // Resetear a 0 hasta que seleccione dirección
      }
    }
  };

  // Manejar selección de dirección desde SmartAddressInput
  const handleAddressSelect = (addressData) => {
    if (addressData) {
      const outOfRange = addressData.outOfRange === true || (maxKm > 0 && (addressData.distance ?? 0) > maxKm);
      if (outOfRange) {
        setErrors(prev => ({
          ...prev,
          address: `La dirección está fuera de la zona de entrega (máximo ${maxKm} km). Seleccioná otra.`
        }));
        setSelectedAddressData(null);
        setFormData(prev => ({ ...prev, address: addressData.address }));
        setShippingCost(0);
        return;
      }
      setSelectedAddressData(addressData);
      setFormData(prev => ({ ...prev, address: addressData.address }));
      setShippingCost(addressData.shippingCost || 0);
      const newErrors = { ...errors };
      delete newErrors.address;
      setErrors(newErrors);
    } else {
      setSelectedAddressData(null);
      setFormData(prev => ({ ...prev, address: '' }));
      setShippingCost(0);
      setAddressInputValue('');
    }
  };


  const handleAddressInputChange = (value) => {
    setAddressInputValue(value);
    setFormData(prev => ({ ...prev, address: value }));
    
    // Si está escribiendo, limpiar selección de datos adicionales
    if (selectedAddressData && selectedAddressData.source === 'map') {
      setSelectedAddressData(null);
      setShippingCost(0);
    }
  };

  const handleMapAddressConfirm = (addressData) => {
    const outOfRange = maxKm > 0 && (addressData.distance ?? 0) > maxKm;
    if (outOfRange) {
      setErrors(prev => ({
        ...prev,
        address: `La dirección está fuera de la zona de entrega (máximo ${maxKm} km). Seleccioná otra.`
      }));
      setSelectedAddressData(null);
      setShowMapPicker(false);
      return;
    }
    setSelectedAddressData(addressData);
    setFormData(prev => ({ ...prev, address: addressData.address }));
    setShippingCost(addressData.shippingCost || 0);
    setAddressInputValue(addressData.address);
    setShowMapPicker(false);
    const newErrors = { ...errors };
    delete newErrors.address;
    setErrors(newErrors);
  };

  const handlePaymentMethodChange = (value) => {
    if (!formData.deliveryOption) {
      setErrors(prev => ({ ...prev, paymentMethod: 'Selecciona primero una forma de entrega' }));
      return;
    }

    if (value === 'Efectivo' && formData.deliveryOption !== 'local') {
      setErrors(prev => ({ ...prev, paymentMethod: 'Para pagos en efectivo debes seleccionar retiro en el local' }));
      return;
    }

    setFormData(prev => ({ ...prev, paymentMethod: value }));
    validateField('paymentMethod', value);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar campos obligatorios
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!formData.deliveryOption) newErrors.deliveryOption = 'Selecciona una opción de entrega';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Selecciona un método de pago';

    // Validar direcciones para delivery
    if (formData.deliveryOption === 'delivery') {
      if (!selectedAddressData || isAddressOutOfRange) {
        newErrors.address = newErrors.address || (isAddressOutOfRange
          ? `La dirección está fuera de la zona de entrega (máximo ${maxKm} km). Seleccioná otra.`
          : 'Selecciona una dirección válida');
      }
      if (formData.isDepartment && !formData.departmentNumber.trim()) {
        newErrors.departmentNumber = 'El número de departamento es obligatorio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmOrder = () => {
    if (!validateForm()) return;

    const message = formData.paymentMethod === 'Efectivo' 
      ? 'Si confirmas, el pedido comenzará su proceso de preparación. Esta acción no se puede deshacer.'
      : 'Si confirmas, serás redirigido a Mercado Pago para completar el pago. El pedido se confirmará una vez recibido el pago.';
    
    setModalMessage(message);
    setShowConfirmModal(true);
  };

  const processOrder = async () => {
    if (!quote) {
      setErrors(prev => ({ ...prev, general: 'Esperá a que se calcule el total antes de confirmar.' }));
      return;
    }
    try {
      const productosParaBackend = (quote.items || items).map((item) => ({
        codigo_barra: item.codigo_barra || item.imageUrl,
        cod_interno: item.cod_interno || 0,
        nombre_producto: item.nombre_producto || item.name,
        cantidad: item.cantidad || item.quantity,
        precio: typeof item.precio === 'number' ? item.precio.toFixed(2) : (item.precio || item.price?.toFixed(2) || '0.00'),
      }));
      const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : null;
      const pedido = {
        ...(idempotencyKey && { idempotencyKey }),
        cliente: formData.name,
        direccion_cliente: formData.deliveryOption === 'delivery'
          ? `${selectedAddressData?.address || formData.address}${formData.departmentNumber ? `, Depto: ${formData.departmentNumber}` : ''}`
          : 'Retiro en local',
        telefono_cliente: formData.phone,
        email_cliente: formData.email,
        cantidad_productos: productosParaBackend.reduce((acc, p) => acc + (p.cantidad || 0), 0),
        subtotal: quote.subtotal.toFixed(2),
        costoEnvio: quote.shipping.toFixed(2),
        monto_total: quote.total,
        discountRule: quote.discountRule ?? 0,
        discountCoupon: quote.discountCoupon ?? 0,
        medio_pago: formData.paymentMethod,
        estado: 'Pendiente',
        notas_local: formData.localNote.trim() || '-',
        deliveryOption: formData.deliveryOption,
        cuponCodigo: quote.couponId ? (cuponCodigo || '') : undefined,
        ...(selectedAddressData && {
          direccion_coords: selectedAddressData.coordinates,
          direccion_distancia: selectedAddressData.distance,
          direccion_componentes: selectedAddressData.components
        }),
        productos: productosParaBackend,
      };

      localStorage.setItem('pedido', JSON.stringify(pedido));

      if (formData.paymentMethod === 'Efectivo') {
        router.push('/confirmacion');
      } else if (formData.paymentMethod === 'MercadoPago') {
        const response = await apiClient.post('/store/create_preference', { total: quote.total });
        window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?preference-id=${response.data.id}`;
      }
    } catch (error) {
      console.error('Error processing order:', error);
      setErrors(prev => ({ ...prev, general: 'No se pudo completar la operación. Intenta nuevamente.' }));
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{config?.storeName ? `PAGO - ${config.storeName}` : 'PAGO - TIENDA'}</title>
        <link rel="icon" type="image/x-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <link rel="shortcut icon" type="image/x-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <link rel="apple-touch-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <meta name="description" content="Finaliza tu compra" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Steps Progress */}
          <div className="flex justify-center items-center mb-6 sm:mb-8 overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-max px-4">
              <div className="flex items-center gap-2 text-green-600">
                <CiCircleCheck className="text-xl sm:text-2xl" />
                <span className="text-xs sm:text-sm font-medium">Productos</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-green-600"></div>
              <div className="flex items-center gap-2 text-green-600">
                <CiCircleCheck className="text-xl sm:text-2xl" />
                <span className="text-xs sm:text-sm font-medium">Carrito</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-blue-600"></div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <CiCircleCheck className="text-xl sm:text-2xl" />
                <span className="text-xs sm:text-sm font-medium">Confirmar</span>
              </div>
            </div>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <IoMdAlert className="text-xl" />
                <span className="font-medium">{errors.general}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Formulario Principal */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Datos Personales */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Datos Personales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <InputField 
                    label="Nombre completo" 
                    icon={CiUser} 
                    error={errors.name}
                    required
                  >
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Juan Pérez"
                    />
                  </InputField>

                  <InputField 
                    label="Teléfono" 
                    icon={CiPhone} 
                    error={errors.phone}
                    required
                  >
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9+\-\s\(\)]/g, '');
                        handleInputChange({ target: { name: 'phone', value } });
                      }}
                      className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: +54 351 123-4567"
                    />
                  </InputField>

                  <div className="md:col-span-2">
                    <InputField 
                      label="Email" 
                      icon={CiMail} 
                      error={errors.email}
                      required
                    >
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Ej: juan@email.com"
                      />
                    </InputField>
                  </div>
                </div>
              </div>

              {/* Forma de Entrega */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Forma de Entrega
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.deliveryOption === 'delivery' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="delivery"
                        checked={formData.deliveryOption === 'delivery'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <CiLocationOn className="text-2xl text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">Envío por delivery</div>
                          <div className="text-xs sm:text-sm text-gray-500">Se calcula según distancia</div>
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.deliveryOption === 'local' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="local"
                        checked={formData.deliveryOption === 'local'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <CiCircleCheck className="text-2xl text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">Retiro en el local</div>
                          <div className="text-xs sm:text-sm text-gray-500">Sin costo adicional</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <ErrorMessage message={errors.deliveryOption} show={!!errors.deliveryOption} />
                </div>

                {/* Dirección para delivery */}
                {formData.deliveryOption === 'delivery' && (
  <div className="mt-6 space-y-4">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CiLocationOn className="text-lg text-gray-500" />
          Dirección de entrega
          <span className="text-red-500">*</span>
        </label>
        <Button
          onClick={() => setShowMapPicker(true)}
          variant="flat"
          size="sm"
          className="text-blue-600 hover:bg-blue-50"
        >
          <IoMdPin className="mr-1" />
          Seleccionar en mapa
        </Button>
      </div>

      {/* Componente SmartAddressInput con valor externo */}
      <SmartAddressInput
        onAddressSelect={handleAddressSelect}
        externalValue={addressInputValue}
        onInputChange={handleAddressInputChange}
        clearTrigger={clearAddressTrigger}
        className="w-full"
      />

      <ErrorMessage message={errors.address} show={!!errors.address && !String(errors.address).includes('fuera de la zona')} />

      {/* Fuera de zona */}
      {showOutOfRangeMessage && maxKm > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <IoMdAlert className="text-amber-600 text-lg flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800">
                La dirección está fuera de la zona de entrega (máximo {maxKm} km). Seleccioná otra.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { handleAddressSelect(null); setClearAddressTrigger(t => t + 1); setErrors(prev => ({ ...prev, address: undefined })); }}
              className="text-sm text-gray-500 hover:text-gray-700 flex-shrink-0 whitespace-nowrap"
              aria-label="Limpiar dirección"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Información adicional solo cuando viene de geocodificación y está dentro de rango */}
      {selectedAddressData && selectedAddressData.distance != null && !isAddressOutOfRange && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <IoMdCheckmarkCircle className="text-blue-600 text-lg flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {selectedAddressData.distance?.toFixed(1)} km • Envío: ${selectedAddressData.shippingCost?.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { handleAddressSelect(null); setClearAddressTrigger(t => t + 1); }}
              className="text-sm text-gray-500 hover:text-gray-700 flex-shrink-0 whitespace-nowrap"
              aria-label="Limpiar dirección"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Departamento - mostrar si hay texto en el input */}
    {formData.address && (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">¿Es un departamento?</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="isDepartment"
                checked={formData.isDepartment === true}
                onChange={() => setFormData(prev => ({ ...prev, isDepartment: true }))}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Sí</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="isDepartment"
                checked={formData.isDepartment === false}
                onChange={() => setFormData(prev => ({ ...prev, isDepartment: false }))}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {formData.isDepartment && (
          <InputField 
            label="Número de departamento" 
            error={errors.departmentNumber}
            required
          >
            <input
              type="text"
              name="departmentNumber"
              value={formData.departmentNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                errors.departmentNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ej: 4B, Piso 2 Depto A"
            />
          </InputField>
        )}
      </div>
    )}
  </div>
)}
              </div>

              {/* Método de Pago */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Método de Pago
                </h2>

                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'Efectivo' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${(!formData.deliveryOption || formData.deliveryOption !== 'local') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Efectivo"
                      checked={formData.paymentMethod === 'Efectivo'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      disabled={!formData.deliveryOption || formData.deliveryOption !== 'local'}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <CiCreditCard1 className="text-2xl text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Efectivo</div>
                        <div className="text-xs sm:text-sm text-gray-500">Solo para retiro en local</div>
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'MercadoPago' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!formData.deliveryOption ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MercadoPago"
                      checked={formData.paymentMethod === 'MercadoPago'}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      disabled={!formData.deliveryOption}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <CiCreditCard1 className="text-2xl text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Mercado Pago</div>
                        <div className="text-xs sm:text-sm text-gray-500">Tarjeta de crédito/débito</div>
                      </div>
                    </div>
                  </label>

                  <ErrorMessage message={errors.paymentMethod} show={!!errors.paymentMethod} />
                </div>
              </div>

              {/* Nota para el local */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota para el local (opcional)
                </label>
                <textarea
                  name="localNote"
                  value={formData.localNote}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Ej: Entregar después de las 18hs, tocar el timbre 2 veces..."
                />
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resumen del pedido
                  </h3>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="h-12 w-12 flex-shrink-0">
                          <img
                            className="h-12 w-12 rounded-md object-contain bg-gray-50"
                            src={getProductImageURL(item.imageUrl)}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = getPlaceholderImageURL();
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${item.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cupón */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <IoMdPricetag className="text-lg" />
                    ¿Tenés un cupón?
                  </h4>
                  {quote?.couponId ? (
                    <div className="flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm font-medium text-green-800">
                        Cupón aplicado: −${(quote.discountCoupon || 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setCuponCodigo(''); setCuponInput(''); setQuoteError(null); }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Quitar cupón
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cuponInput}
                          onChange={(e) => setCuponInput(e.target.value)}
                          placeholder="Código del cupón"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          onClick={() => {
                            const cod = cuponInput.trim();
                            if (!cod) {
                              toast.error('Ingresá un código');
                              return;
                            }
                            setCuponCodigo(cod);
                            setQuoteError(null);
                          }}
                          disabled={quoteLoading}
                        >
                          Aplicar
                        </Button>
                      </div>
                      {quoteLoading && (
                        <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                          <span>Verificando cupón...</span>
                        </div>
                      )}
                    </div>
                  )}
                  {quoteError && !quote?.couponId && (
                    <p className="mt-1 text-sm text-red-600">{quoteError}</p>
                  )}
                </div>

                <div className="p-4 sm:p-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} productos)</span>
                    <span>${quote ? quote.subtotal.toFixed(2) : subtotalCart.toFixed(2)}</span>
                  </div>
                  {quote && quote.discountRule > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento (promo)</span>
                      <span>−${quote.discountRule.toFixed(2)}</span>
                    </div>
                  )}
                  {quote && quote.discountCoupon > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento (cupón)</span>
                      <span>−${quote.discountCoupon.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className={
                      formData.deliveryOption === 'local'
                        ? 'text-green-600 font-medium'
                        : quote?.envioGratis
                        ? 'text-green-600 font-medium'
                        : (quote ? 'text-gray-900 font-medium' : 'text-gray-500')
                    }>
                      {formData.deliveryOption === 'local'
                        ? '$0.00'
                        : quote
                        ? (quote.envioGratis ? 'Envío gratis' : `$${quote.shipping.toFixed(2)}`)
                        : quoteLoading
                        ? 'Calculando...'
                        : 'Selecciona dirección'}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {quoteLoading && !quote ? '...' : `$${Number(total).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 pt-0 space-y-6">
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={Object.keys(errors).length > 0 || !formData.paymentMethod || !quote || quoteLoading || isAddressOutOfRange || (!!errors.address && String(errors.address).includes('fuera de la zona'))}
                    color="primary"
                    size="lg"
                    fullWidth
                    className="font-semibold"
                  >
                    Confirmar Pedido
                  </Button>

                  <Link href="/checkout">
                    <Button
                      variant="flat"
                      size="lg"
                      fullWidth
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                    >
                      Editar Carrito
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AddressMapPicker Modal */}
        <AddressMapPicker
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onConfirm={handleMapAddressConfirm}
          initialAddress={selectedAddressData}
        />

        {/* Modal de confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🛒</div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ¿Confirmar pedido?
                </h3>
                <p className="text-gray-600 text-sm">
                  {modalMessage}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setShowConfirmModal(false);
                    processOrder();
                  }}
                  color="primary"
                  className="flex-1"
                >
                  Sí, confirmar
                </Button>
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="bordered"
                  className="flex-1"
                >
                  Cancelar
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