// src/hooks/useEngineControl.js
// Hook que encapsula TODA la lógica de parar/activar motor.
// Usa traccarService (que internamente usa apiClient con retry, timeout, 401).

import { useState, useCallback, useEffect } from 'react';
import { traccarService } from '../api/traccarApi';
import { useDemo } from '../context/DemoContext';

export function useEngineControl(deviceId) {
  const { isDemoMode } = useDemo();
  const [engineStopped, setEngineStopped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resetear estado al cambiar de vehículo
  useEffect(() => {
    setEngineStopped(false);
    setError(null);
  }, [deviceId]);

  // GUARD: En demo, no enviar comandos reales a Traccar
  const sendCommand = useCallback(async (type) => {
    if (isDemoMode || !deviceId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await traccarService.sendCommand(deviceId, { type });
      setEngineStopped(type === 'engineStop');
      return true;
    } catch (err) {
      setError(err.message || 'Error al enviar comando');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isDemoMode]);

  const stopEngine = useCallback(() => sendCommand('engineStop'), [sendCommand]);
  const startEngine = useCallback(() => sendCommand('engineResume'), [sendCommand]);
  const toggleEngine = useCallback(() => {
    return engineStopped ? startEngine() : stopEngine();
  }, [engineStopped, stopEngine, startEngine]);

  return { engineStopped, isLoading, error, stopEngine, startEngine, toggleEngine };
}
