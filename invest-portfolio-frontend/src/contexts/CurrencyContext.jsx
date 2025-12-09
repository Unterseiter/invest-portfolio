// contexts/CurrencyContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Получаем валюту из localStorage или ставим RUB по умолчанию
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'RUB';
  });

  // Состояние для курсов валют
  const [exchangeRates, setExchangeRates] = useState(() => {
    const cached = localStorage.getItem('currencyRates');
    return cached ? JSON.parse(cached) : null;
  });

  // Загружаем курсы валют при монтировании
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        // Бесплатный API для курсов валют (RUB как базовая)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/RUB');
        const data = await response.json();
        
        // Сохраняем только нужные нам валюты
        const rates = {
          RUB: 1,
          USD: data.rates.USD || 0.011,
          EUR: data.rates.EUR || 0.01,
          CNY: data.rates.CNY || 0.08,
          timestamp: Date.now()
        };

        setExchangeRates(rates);
        localStorage.setItem('currencyRates', JSON.stringify(rates));
        
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        // Используем фиксированные курсы как fallback
        const fallbackRates = {
          RUB: 1,
          USD: 0.011,
          EUR: 0.01,
          CNY: 0.08,
          timestamp: Date.now()
        };
        setExchangeRates(fallbackRates);
      }
    };

    // Загружаем курсы если их нет или они старые (старше 1 часа)
    if (!exchangeRates || Date.now() - exchangeRates.timestamp > 3600000) {
      loadExchangeRates();
    }
  }, []);

  // Функция для изменения валюты
  const changeCurrency = (currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem('selectedCurrency', currency);
  };

  // Функция конвертации цены
  const convertPrice = (priceInRubles) => {
    if (!exchangeRates || selectedCurrency === 'RUB') return priceInRubles;
    
    const rate = exchangeRates[selectedCurrency];
    if (!rate) return priceInRubles;
    
    return priceInRubles * rate;
  };

  // Функция форматирования цены с символом валюты
  const formatPrice = (priceInRubles, options = {}) => {
    const converted = convertPrice(priceInRubles);
    
    const {
      showSymbol = true,
      decimals = 2,
      locale = 'ru-RU'
    } = options;

    const currencySymbols = {
      RUB: '₽',
      USD: '$',
      EUR: '€',
      CNY: '¥'
    };

    const formattedNumber = converted.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return showSymbol 
      ? `${formattedNumber} ${currencySymbols[selectedCurrency] || selectedCurrency}`
      : formattedNumber;
  };

  // Функция форматирования изменения (с + или -)
  const formatChange = (changeInRubles, percent, options = {}) => {
    const convertedChange = convertPrice(changeInRubles);
    const sign = convertedChange >= 0 ? '+' : '';
    
    const {
      showPercent = true,
      decimals = 2
    } = options;

    const formattedChange = Math.abs(convertedChange).toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    if (showPercent) {
      return `${sign}${formattedChange} (${sign}${percent.toFixed(2)}%)`;
    }
    
    return `${sign}${formattedChange}`;
  };

  // Получить символ валюты
  const getCurrencySymbol = () => {
    const symbols = {
      RUB: '₽',
      USD: '$',
      EUR: '€',
      CNY: '¥'
    };
    return symbols[selectedCurrency] || selectedCurrency;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      exchangeRates,
      changeCurrency,
      convertPrice,
      formatPrice,
      formatChange,
      getCurrencySymbol
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};