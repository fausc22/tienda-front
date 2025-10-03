// components/horarios/HorariosModal.jsx - Modal para mostrar cuando está cerrado
import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { IoMdClose, IoMdTime, IoMdInformationCircle } from 'react-icons/io';

const HorariosModal = ({ 
  isOpen, 
  onClose, 
  onContinuar, 
  mensajeInfo, 
  showContinueButton = true,
  autoCloseSeconds = 0 
}) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseSeconds);

  // Contador para auto-cierre
  useEffect(() => {
    if (autoCloseSeconds > 0 && isOpen) {
      setTimeLeft(autoCloseSeconds);
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoCloseSeconds, isOpen, onClose]);

  if (!isOpen || !mensajeInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <IoMdTime className="text-red-600 text-xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {mensajeInfo.titulo}
            </h3>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <IoMdClose className="text-gray-500 text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Icono principal */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🕐</div>
          </div>

          {/* Mensaje principal */}
          <div className="text-center space-y-3">
            <p className="text-gray-700 leading-relaxed">
              {mensajeInfo.mensaje}
            </p>
            
            {/* Horarios */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <IoMdInformationCircle className="text-blue-600" />
                <span className="font-medium text-blue-800">Horarios de atención</span>
              </div>
              <p className="text-blue-700 font-medium">
                {mensajeInfo.horarios}
              </p>
            </div>

            {/* Próxima apertura */}
            {mensajeInfo.proximaApertura && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 font-medium">
                  🕒 {mensajeInfo.proximaApertura}
                </p>
              </div>
            )}
          </div>

          {/* Nota adicional */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 mt-0.5">
                💡
              </div>
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Puedes continuar con tu pedido. Lo registraremos y comenzaremos a prepararlo en cuanto abramos.
                </p>
              </div>
            </div>
          </div>

          {/* Auto-close counter */}
          {autoCloseSeconds > 0 && timeLeft > 0 && (
            <div className="text-center text-sm text-gray-500">
              Este mensaje se cerrará automáticamente en {timeLeft} segundo{timeLeft !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          {showContinueButton && (
            <Button
              fullWidth
              color="primary"
              onClick={onContinuar}
              className="font-semibold py-3"
            >
              Entendido, continuar con el pedido
            </Button>
          )}
          
          <Button
            fullWidth
            variant="flat"
            onClick={onClose}
            className="font-medium"
          >
            {showContinueButton ? 'Revisar más tarde' : 'Cerrar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HorariosModal;