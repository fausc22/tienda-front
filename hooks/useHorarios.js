// hooks/useHorarios.js - VERSIÓN CON ESTADOS ACTIVA/INACTIVA
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
        console.log(`✅ Horario verificado:`, data);
      }

      return data;
    } catch (err) {
      console.error('❌ Error verificando horario:', err);
      setError(err.message);
      
      const fallbackData = {
        estaAbierto: true,
        bloqueado: false,
        pageStatus: 'ACTIVA',
        error: true,
        mensaje: 'Error al verificar horarios, se permite continuar'
      };
      
      setHorarioInfo(fallbackData);
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🆕 NUEVA FUNCIÓN: Obtener tipo de bloqueo
  const obtenerTipoBloqueo = useCallback(() => {
    if (!horarioInfo) return null;
    
    // CASO 1: Tienda INACTIVA → Bloqueo total
    if (horarioInfo.pageStatus === 'INACTIVA' || horarioInfo.bloqueado) {
      return {
        tipo: 'INACTIVO',
        titulo: 'Tienda Inactiva',
        mensaje: 'La tienda está temporalmente inactiva.',
        detalle: 'No es posible realizar pedidos en este momento. Por favor, intente más tarde.',
        permiteContinuar: false, // ← NO permite continuar
        icono: '🚫'
      };
    }
    
    // CASO 2: Tienda ACTIVA pero CERRADA por horarios
    if (horarioInfo.pageStatus === 'ACTIVA' && !horarioInfo.estaAbierto) {
      return {
        tipo: 'CERRADO',
        titulo: 'Local Cerrado',
        mensaje: horarioInfo.mensaje || 'Estamos fuera de horario',
        horarios: horarioInfo.horariosDelDia || (horarioInfo.horarios?.aperturaFormateada ? 
          `${horarioInfo.horarios.aperturaFormateada} - ${horarioInfo.horarios.cierreFormateada}` : 
          'Consultar horarios'),
        proximaApertura: horarioInfo.proximaApertura,
        detalle: 'Puedes continuar con tu pedido. Lo registraremos y comenzaremos a prepararlo cuando abramos.',
        permiteContinuar: true, // ← SÍ permite continuar
        icono: '🕐'
      };
    }
    
    // CASO 3: Está abierto, no hay bloqueo
    return null;
  }, [horarioInfo]);

  // Función para obtener mensaje de estado simple
  const obtenerMensajeEstado = useCallback(() => {
    if (!horarioInfo) return 'Verificando horarios...';
    
    if (horarioInfo.error) {
      return 'No se pudieron verificar los horarios';
    }

    if (horarioInfo.pageStatus === 'INACTIVA') {
      return '🔴 Tienda inactiva';
    }

    const { estaAbierto, mensaje, horarios } = horarioInfo;
    
    if (estaAbierto) {
      return `🟢 Estamos abiertos${horarios?.cierreFormateada ? ` hasta las ${horarios.cierreFormateada}` : ''}`;
    } else {
      return `🔴 ${mensaje || 'Cerrado'}`;
    }
  }, [horarioInfo]);

  // Función para obtener mensaje detallado cuando está cerrado
  const obtenerMensajePedidoFueraHorario = useCallback(() => {
    const bloqueo = obtenerTipoBloqueo();
    if (!bloqueo) return null;
    
    return {
      titulo: bloqueo.titulo,
      mensaje: bloqueo.mensaje,
      horarios: bloqueo.horarios || '',
      proximaApertura: bloqueo.proximaApertura,
      detalle: bloqueo.detalle,
      permiteContinuar: bloqueo.permiteContinuar,
      icono: bloqueo.icono
    };
  }, [obtenerTipoBloqueo]);

  // Auto-refresh
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
    estaBloqueado: horarioInfo?.bloqueado || false, // 🆕 NUEVO
    pageStatus: horarioInfo?.pageStatus, // 🆕 NUEVO
    verificarHorario,
    obtenerMensajeEstado,
    obtenerMensajePedidoFueraHorario,
    obtenerTipoBloqueo, // 🆕 NUEVO
    pausarAutoRefresh,
    reanudarAutoRefresh,
    ultimaVerificacion: lastCheckRef.current,
    razon: horarioInfo?.razon,
    mensaje: horarioInfo?.mensaje
  };
};

export default useHorarios;