// CurrencySettings.jsx
import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

function CurrencySettings() {
  const { selectedCurrency, changeCurrency, exchangeRates } = useCurrency();
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    if (exchangeRates?.timestamp) {
      const date = new Date(exchangeRates.timestamp);
      setLastUpdate(date.toLocaleTimeString('ru-RU'));
    }
  }, [exchangeRates]);

  const currencies = [
    { code: 'RUB', name: 'Российский рубль (₽)' },
    { code: 'USD', name: 'Доллар США ($)' },
    { code: 'EUR', name: 'Евро (€)' },
    { code: 'CNY', name: 'Китайский юань (¥)' }
  ];

  const handleCurrencyChange = (currencyCode) => {
    changeCurrency(currencyCode);
  };

  return (
    <>
      <div className="setting-group">
        <h3 className="setting-group__title">Основная валюта</h3>
        <p className="setting-group__description">
          Выберите валюту по умолчанию для отображения сумм
          {lastUpdate && (
            <span className="currency-update-time">
              (курсы обновлены: {lastUpdate})
            </span>
          )}
        </p>
        <div className="setting-options">
          {currencies.map((currency) => (
            <label key={currency.code} className="setting-option">
              <input 
                type="radio" 
                name="currency" 
                value={currency.code}
                checked={selectedCurrency === currency.code}
                onChange={() => handleCurrencyChange(currency.code)}
                className="setting-option__input"
              />
              <span className="setting-option__label">
                <span className="option-text">{currency.name}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Остальные настройки остаются без изменений */}
      <div className="setting-group">
        <h3 className="setting-group__title">Формат чисел</h3>
        <p className="setting-group__description">
          Настройте отображение десятичных разделителей
        </p>
        <div className="setting-options">
          <label className="setting-option">
            <input 
              type="radio" 
              name="numberFormat" 
              value="russian" 
              className="setting-option__input"
              defaultChecked
            />
            <span className="setting-option__label">
              <span className="option-text">Российский (1 000,00)</span>
            </span>
          </label>
          
          <label className="setting-option">
            <input 
              type="radio" 
              name="numberFormat" 
              value="european" 
              className="setting-option__input"
            />
            <span className="setting-option__label">
              <span className="option-text">Европейский (1.000,00)</span>
            </span>
          </label>
          
          <label className="setting-option">
            <input 
              type="radio" 
              name="numberFormat" 
              value="american" 
              className="setting-option__input"
            />
            <span className="setting-option__label">
              <span className="option-text">Американский (1,000.00)</span>
            </span>
          </label>
        </div>
      </div>
    </>
  );
}

export default CurrencySettings;