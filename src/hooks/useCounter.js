// src/hooks/useCounter.js
import { useState, useEffect } from "react";

// Hook: Contador Animado (anima un número de 0 al target)
export default function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const finalTarget = target || 0;
    if (finalTarget === 0) { setCount(0); return; }

    const step = finalTarget / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= finalTarget) {
        setCount(finalTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}
