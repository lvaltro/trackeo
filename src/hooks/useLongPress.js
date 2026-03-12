// ═══════════════════════════════════════════════════
// useLongPress — Hook para detectar pulsación larga
// Activa modo edición tras mantener 2 segundos
// ═══════════════════════════════════════════════════
import { useRef, useCallback } from 'react';

/**
 * @param {() => void} onLongPress - Callback al completar long press
 * @param {number} delay - Tiempo en ms (default 2000)
 * @returns {{ onPressStart, onPressEnd }} - Event handlers
 */
export function useLongPress(onLongPress, delay = 2000) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const onPressStart = useCallback((e) => {
    // Solo activar con touch o click primario
    if (e.button && e.button !== 0) return;
    
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Feedback háptico en móvil
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const onPressEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPressCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: onPressStart,
    onMouseUp: onPressEnd,
    onMouseLeave: onPressCancel,
    onTouchStart: onPressStart,
    onTouchEnd: onPressEnd,
    onTouchCancel: onPressCancel,
  };
}

export default useLongPress;
