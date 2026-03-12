// src/context/DemoContext.jsx
// Contexto global para el Modo Demo (Test Drive).
// Provee: isDemoMode, enterDemo(), exitDemo(), showPaywall(), DemoPaywallModal integrado.

import React, { createContext, useContext, useState, useCallback } from 'react';
import DemoPaywallModal from '../components/DemoPaywallModal';

const DemoContext = createContext({
  isDemoMode: false,
  enterDemo: () => {},
  exitDemo: () => {},
  showPaywall: () => {},
});

export const useDemo = () => useContext(DemoContext);

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const enterDemo = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const showPaywall = useCallback(() => {
    setPaywallOpen(true);
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemo, exitDemo, showPaywall }}>
      {children}
      <DemoPaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </DemoContext.Provider>
  );
};

export default DemoContext;
