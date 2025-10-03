// hooks/useHorarios.js - Hook personalizado para gestión de horarios
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../config/api';

export const useHorarios = (autoRefresh = true, intervalMinutes = 5) => {
  const [horarioInfo, setHorarioInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(null);

  // Función para verificar horarios
  const verificarHorario = useCallback(async (showLogs = false) => {
    try {
      if (showLogs && process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🕐 Verificando horario de la tienda...');
      }

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
      
      // Fallback en caso de error - asumir que está abierto
      const fallbackData = {
        estaAbierto: true,
        error: true,
        mensaje: 'Error al verificar horarios, se permite continuar',
        horarios: {
          apertura: '08:00',
          cierre: '02:00',
          aperturaFormateada: '8:00 AM',
          cierreFormateada: '2:00 AM'
        }
      };
      
      setHorarioInfo(fallbackData);
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener estado simple
  const verificarEstadoSimple = useCallback(async () => {
    try {
      const response = await apiClient.get('/store/horario/simple');
      return response.data;
    } catch (err) {
      console.error('❌ Error verificando estado simple:', err);
      return { estaAbierto: true, error: true };
    }
  }, []);

  // Función para formatear tiempo restante
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

  // Función para obtener mensaje descriptivo
  const obtenerMensajeEstado = useCallback(() => {
    if (!horarioInfo) return 'Verificando horarios...';
    
    if (horarioInfo.error) {
      return 'No se pudieron verificar los horarios, pero puedes continuar con tu pedido';
    }

    const { estaAbierto, horarios, tiempos } = horarioInfo;
    
    if (estaAbierto) {
      if (tiempos.minutosParaCerrar <= 30) {
        return `🟡 Cerramos en ${formatearTiempoRestante(tiempos.minutosParaCerrar)}`;
      }
      return `🟢 Estamos abiertos hasta las ${horarios.cierreFormateada}`;
    } else {
      return `🔴 Estamos cerrados. Abrimos a las ${horarios.aperturaFormateada}`;
    }
  }, [horarioInfo, formatearTiempoRestante]);

  // Función para obtener mensaje de pedido fuera de horario
  const obtenerMensajePedidoFueraHorario = useCallback(() => {
    if (!horarioInfo || horarioInfo.estaAbierto) return null;

    const { horarios } = horarioInfo;
    
    return {
      titulo: 'Local Cerrado',
      mensaje: `Nuestro local se encuentra cerrado en este momento. Tu pedido será registrado y preparado cuando volvamos a abrir.`,
      horarios: `Horarios de atención: ${horarios.aperturaFormateada} a ${horarios.cierreFormateada}`,
      proximaApertura: horarioInfo.tiempos ? 
        `Abrimos en: ${formatearTiempoRestante(horarioInfo.tiempos.minutosParaAbrir)}` : 
        ''
    };
  }, [horarioInfo, formatearTiempoRestante]);

  // Configurar auto-refresh
  useEffect(() => {
    // Verificación inicial
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

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Función para pausar auto-refresh temporalmente
  const pausarAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Función para reanudar auto-refresh
  const reanudarAutoRefresh = useCallback(() => {
    if (autoRefresh && intervalMinutes > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        verificarHorario(false);
      }, intervalMinutes * 60 * 1000);
    }
  }, [autoRefresh, intervalMinutes, verificarHorario]);

  return {
    // Estados principales
    horarioInfo,
    loading,
    error,
    
    // Estado calculado
    estaAbierto: horarioInfo?.estaAbierto || false,
    estaCerrado: horarioInfo ? !horarioInfo.estaAbierto : false,
    
    // Funciones de verificación
    verificarHorario,
    verificarEstadoSimple,
    
    // Funciones de formateo y mensajes
    formatearTiempoRestante,
    obtenerMensajeEstado,
    obtenerMensajePedidoFueraHorario,
    
    // Control de auto-refresh
    pausarAutoRefresh,
    reanudarAutoRefresh,
    
    // Información adicional
    ultimaVerificacion: lastCheckRef.current,
    tiempoParaCerrar: horarioInfo?.tiempos?.minutosParaCerrar || null,
    tiempoParaAbrir: horarioInfo?.tiempos?.minutosParaAbrir || null
  };
};

// Hook simplificado para casos básicos
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
        setEstaAbierto(true); // Fallback
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, []);

  return { estaAbierto, loading };
};

export default useHorarios;