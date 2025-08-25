import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@heroui/button';
import { CiCircleCheck, CiLocationOn, CiCreditCard1, CiUser, CiPhone, CiMail } from 'react-icons/ci';
import { IoMdClose, IoMdCheckmarkCircle, IoMdAlert, IoMdTrash, IoMdPin } from 'react-icons/io';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import SmartAddressInput from '../components/pago/SmartAddressInput';
import AddressMapPicker from '../components/pago/AddressMapPicker';
import apiClient from '../config/api';

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

  // Estados para manejo de envío
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  
  // Estados de UI
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [addressSource, setAddressSource] = useState(null); // 'input' o 'map'
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const finalShippingCost = formData.deliveryOption === 'local' ? 0 : shippingCost;
  const total = parseFloat(subtotal.toFixed(2)) + parseFloat(finalShippingCost.toFixed(2));

  // Redireccionar si no hay productos
  useEffect(() => {
    if (items.length === 0) {
      router.push('/checkout');
    }
  }, [items, router]);

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
        if (formData.deliveryOption === 'delivery' && !selectedAddressData) {
          newErrors.address = 'Selecciona una dirección válida';
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
  const handleAddressSelect = (addressData, source) => {
  if (addressData) {
    setSelectedAddressData(addressData);
    setFormData(prev => ({ ...prev, address: addressData.address }));
    setShippingCost(addressData.shippingCost || 0);
    setAddressSource(source);
    validateField('address', addressData.address);
    
    console.log('Dirección seleccionada desde:', source, addressData);
  } else {
    // Limpiar selección
    setSelectedAddressData(null);
    setFormData(prev => ({ ...prev, address: '' }));
    setShippingCost(0);
    setAddressSource(null);
    delete errors.address;
    setErrors({ ...errors });
  }
};

// Función actualizada para manejar confirmación desde AddressMapPicker
const handleMapAddressConfirm = (addressData) => {
  handleAddressSelect(addressData, 'map');
  setShowMapPicker(false);
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
      if (!selectedAddressData) {
        newErrors.address = 'Selecciona una dirección válida';
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
    try {
      const finalShippingCost = formData.deliveryOption === 'local' ? 0 : shippingCost;
      
      const pedido = {
        cliente: formData.name,
        direccion_cliente: formData.deliveryOption === 'delivery' 
          ? `${selectedAddressData?.address}${formData.departmentNumber ? `, Depto: ${formData.departmentNumber}` : ''}` 
          : 'Retiro en local',
        telefono_cliente: formData.phone,
        email_cliente: formData.email,
        cantidad_productos: items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
        costoEnvio: finalShippingCost.toFixed(2),
        monto_total: total,
        medio_pago: formData.paymentMethod,
        estado: 'Pendiente',
        notas_local: formData.localNote.trim() || '-',
        // Agregar datos adicionales de dirección si están disponibles
        ...(selectedAddressData && {
          direccion_coords: selectedAddressData.coordinates,
          direccion_distancia: selectedAddressData.distance,
          direccion_componentes: selectedAddressData.components
        }),
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
        <link rel="icon" href="https://vps-5234411-x.dattaweb.com/api/images/favicon.ico" />
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

      {/* Componente SmartAddressInput */}
      <SmartAddressInput
        onAddressSelect={handleAddressSelect}
        initialValue={addressSource === 'input' ? formData.address : ''}
        className="w-full"
        isActive={addressSource !== 'map'}
      />

      <ErrorMessage message={errors.address} show={!!errors.address} />

      {/* Información de la dirección seleccionada */}
      {selectedAddressData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <IoMdCheckmarkCircle className="text-blue-600 text-lg flex-shrink-0" />
                <span className="font-medium text-blue-800">
                  Dirección {addressSource === 'map' ? 'desde mapa' : 'confirmada'}
                </span>
              </div>
              
              <p className="text-sm text-gray-800 mb-2">
                {selectedAddressData.address}
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  📍 {selectedAddressData.distance?.toFixed(1)} km
                </span>
                <span className="font-medium text-blue-700">
                  Envío: ${selectedAddressData.shippingCost?.toFixed(2)}
                </span>
              </div>
            </div>
            
            <Button
              onClick={() => handleAddressSelect(null, null)}
              variant="flat"
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <IoMdClose />
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* Departamento - solo mostrar si hay dirección seleccionada */}
    {selectedAddressData && (
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
                            src={`https://www.rsoftware.com.ar/imgart/${item.imageUrl}.png`}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
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

                <div className="p-4 sm:p-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} productos)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className={
                      formData.deliveryOption === 'local' 
                        ? 'text-green-600 font-medium'
                        : shippingCost > 0 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-500'
                    }>
                      {formData.deliveryOption === 'local' 
                        ? '$0.00' 
                        : shippingCost > 0 
                        ? `${shippingCost.toFixed(2)}` 
                        : 'Selecciona dirección'}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 pt-0 space-y-6">
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={Object.keys(errors).length > 0 || !formData.paymentMethod}
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