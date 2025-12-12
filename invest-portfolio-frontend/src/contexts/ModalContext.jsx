// contexts/ModalContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    const isAccepted = localStorage.getItem('warningAccepted');
    const hideSetting = localStorage.getItem('hideWarningModal');
    
    // Показываем модалку только если пользователь еще не согласился
    // И не установил настройку "не показывать"
    if (!isAccepted && !hideSetting) {
      setShowWarning(true);
    }
  }, []);

  const acceptWarning = (dontShowAgain) => {
    localStorage.setItem('warningAccepted', 'true');
    if (dontShowAgain) {
      localStorage.setItem('hideWarningModal', 'true');
    }
    setShowWarning(false);
  };

  const rejectWarning = () => {
    // Закрываем окно браузера
    window.close();
    
    // Если браузер не позволяет закрыть, перенаправляем на страницу отказа
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 100);
  };

  const showWarningModal = () => {
    setShowWarning(true);
  };

  const hideWarningModal = () => {
    setShowWarning(false);
  };

  return (
    <ModalContext.Provider value={{ 
      showWarning, 
      acceptWarning, 
      rejectWarning,
      showWarningModal,
      hideWarningModal
    }}>
      {children}
    </ModalContext.Provider>
  );
};