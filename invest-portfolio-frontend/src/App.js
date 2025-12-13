// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import Header from './components/Align/Header/Header';
import Footer from './components/Align/Footer/Footer';
import Sidebar from './components/Align/Sidebar/Sidebar';
import './App.css';

import HomePage from './pages/home/HomePage';
import SettingsPage from './pages/settings/SettingsPage';
import MonitoringPage from './pages/monitor/MonitoringPage';
import FunctionalPage from './pages/functional/FunctionalPage';

import { CurrencyProvider } from './contexts/CurrencyContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import WarningModal from './components/common/modal/WarningModal/WarningModal';

// Компонент с контентом приложения
const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  const { showWarning, acceptWarning, rejectWarning } = useModal();

  // Определяем тип устройства
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setScreenSize('mobile');
        // На мобильных сайдбар по умолчанию закрыт
        setIsSidebarOpen(false);
      } else if (width <= 1024) {
        setScreenSize('tablet');
        // На планшетах сайдбар по умолчанию открыт
        setIsSidebarOpen(true);
      } else {
        setScreenSize('desktop');
        // На десктопе сайдбар всегда открыт
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const toggleSidebar = () => {
    // На десктопе сайдбар всегда открыт, переключение не нужно
    if (screenSize === 'desktop') return;
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    // На десктопе сайдбар всегда открыт, закрытие не нужно
    if (screenSize === 'desktop') return;
    setIsSidebarOpen(false);
  };

  // На десктопе сайдбар всегда считается "открытым"
  const sidebarIsOpen = screenSize === 'desktop' ? true : isSidebarOpen;

  return (
    <>
      {/* Модальное окно с предупреждением */}
      {showWarning && (
        <WarningModal
          onAccept={acceptWarning}
          onReject={rejectWarning}
          licenseUrl="/user-agreement" // Замените на реальный URL
        />
      )}
      
      {/* Основной контент приложения */}
      <div className={`App ${sidebarIsOpen ? 'sidebar-open' : ''} screen-${screenSize}`}>
        <Header 
          isSidebarOpen={sidebarIsOpen}
          onToggleSidebar={toggleSidebar}
        />
        
        <main className='App-body'>
          <Sidebar 
            isOpen={sidebarIsOpen}
            onClose={closeSidebar}
          />
          <div className='main-content'>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/settings' element={<SettingsPage />} />
              <Route path='/monitoring' element={<MonitoringPage />} />
              <Route path='/functional' element={<FunctionalPage />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

// Главный компонент App с провайдерами
function App() {
  return (
    <ModalProvider>
      <CurrencyProvider>
        <Router>
          <AppContent />
        </Router>
      </CurrencyProvider>
    </ModalProvider>
  );
}

export default App;