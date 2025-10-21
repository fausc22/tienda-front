// hooks/useHorarios.js - VERSIÓN ACTUALIZADA
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../config/api';

export const useHorarios = (autoRefresh = true, intervalMinutes = 5) => {
  const [horarioInfo, setHorarioInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(null);

  // Función para verificar horarios - 🆕 ACTUALIZADA PARA USAR NUEVO ENDPOINT
  const verificarHorario = useCallback(async (showLogs = false) => {
    try {
      if (showLogs && process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🕐 Verificando horario de la tienda...');
      }

      // 🆕 NUEVO ENDPOINT QUE USA EL SISTEMA AVANZADO
      const response = await apiClient.get('/store/horario');
      const data = response.data;

      setHorarioInfo(data);
      setError(null);
      lastCheckRef.current = new Date();

      if (showLogs && process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log(`✅ Horario verificado: ${data.estaAbierto ? 'ABIERTO' : 'CERRADO'}`, data);
      }

      return data;
    } catch (err) {
      console.error('❌ Error verificando horario:', err);
      setError(err.message);
      
      const fallbackData = {
        estaAbierto: true,
        error: true,
        mensaje: 'Error al verificar horarios, se permite continuar',
        horarios: {
          apertura: '08:00',
          cierre: '22:00',
          aperturaFormateada: '8:00 AM',
          cierreFormateada: '10:00 PM'
        }
      };
      
      setHorarioInfo(fallbackData);
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarEstadoSimple = useCallback(async () => {
    try {
      const response = await apiClient.get('/store/horario/simple');
      return response.data;
    } catch (err) {
      console.error('❌ Error verificando estado simple:', err);
      return { estaAbierto: true, error: true };
    }
  }, []);

  const formatearTiempoRestante = useCallback((minutos) => {
    if (minutos <= 0) return 'Ahora';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas === 0) {
      return `${mins} minuto${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${horas} hora${horas !== 1 ? 's' : ''}`;
    } else {
      return `${horas}h ${mins}m`;
    }
  }, []);

  const obtenerMensajeEstado = useCallback(() => {
    if (!horarioInfo) return 'Verificando horarios...';
    
    if (horarioInfo.error) {
      return 'No se pudieron verificar los horarios, pero puedes continuar con tu pedido';
    }

    const { estaAbierto, razon, mensaje, horarios, proximaApertura } = horarioInfo;
    
    if (estaAbierto) {
      if (razon === 'Horario especial') {
        return `🟡 ${mensaje}`;
      }
      return `🟢 Estamos abiertos${horarios?.cierre ? ` hasta las ${horarios.cierre}` : ''}`;
    } else {
      if (razon === 'Excepción de horario') {
        return `🔴 ${mensaje}`;
      }
      if (proximaApertura) {
        return `🔴 Cerrado. Abrimos a las ${proximaApertura}`;
      }
      return `🔴 ${mensaje}`;
    }
  }, [horarioInfo]);

  const obtenerMensajePedidoFueraHorario = useCallback(() => {
    if (!horarioInfo || horarioInfo.estaAbierto) return null;

    const { razon, mensaje, horarios } = horarioInfo;
    
    return {
      titulo: razon === 'Excepción de horario' ? 'Día Especial' : 'Local Cerrado',
      mensaje: mensaje || 'Nuestro local se encuentra cerrado en este momento.',
      horarios: horarios ? 
        `Horario: ${horarios.apertura || 'N/A'} a ${horarios.cierre || 'N/A'}` : 
        '',
      info: 'Tu pedido será registrado y preparado cuando volvamos a abrir.'
    };
  }, [horarioInfo]);

  useEffect(() => {
    verificarHorario(true);

    if (autoRefresh && intervalMinutes > 0) {
      intervalRef.current = setInterval(() => {
        verificarHorario(false);
      }, intervalMinutes * 60 * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [verificarHorario, autoRefresh, intervalMinutes]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const pausarAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reanudarAutoRefresh = useCallback(() => {
    if (autoRefresh && intervalMinutes > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        verificarHorario(false);
      }, intervalMinutes * 60 * 1000);
    }
  }, [autoRefresh, intervalMinutes, verificarHorario]);

  return {
    horarioInfo,
    loading,
    error,
    estaAbierto: horarioInfo?.estaAbierto || false,
    estaCerrado: horarioInfo ? !horarioInfo.estaAbierto : false,
    verificarHorario,
    verificarEstadoSimple,
    formatearTiempoRestante,
    obtenerMensajeEstado,
    obtenerMensajePedidoFueraHorario,
    pausarAutoRefresh,
    reanudarAutoRefresh,
    ultimaVerificacion: lastCheckRef.current,
    razon: horarioInfo?.razon,
    mensaje: horarioInfo?.mensaje
  };
};

export const useEstadoTienda = () => {
  const [estaAbierto, setEstaAbierto] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      try {
        const response = await apiClient.get('/store/horario/simple');
        setEstaAbierto(response.data.estaAbierto);
      } catch (error) {
        console.error('Error verificando estado de tienda:', error);
        setEstaAbierto(true);
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, []);

  return { estaAbierto, loading };
};

export default useHorarios;