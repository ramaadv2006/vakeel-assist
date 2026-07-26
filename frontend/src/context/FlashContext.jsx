import { createContext, useCallback, useContext, useState } from 'react';

const FlashContext = createContext(null);
let nextId = 1;

export function FlashProvider({ children }) {
  const [flashes, setFlashes] = useState([]);

  const addFlash = useCallback((message, category = 'success') => {
    const id = nextId++;
    setFlashes((prev) => [...prev, { id, message, category }]);
    return id;
  }, []);

  const removeFlash = useCallback((id) => {
    setFlashes((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <FlashContext.Provider value={{ flashes, addFlash, removeFlash }}>
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error('useFlash must be used within FlashProvider');
  return ctx.addFlash;
}

export function useFlashState() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error('useFlashState must be used within FlashProvider');
  return ctx;
}
