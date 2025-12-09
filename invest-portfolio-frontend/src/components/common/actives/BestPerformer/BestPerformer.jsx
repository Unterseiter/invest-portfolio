import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './BestPerformer.css';
import ChartUp from '../../../../assets/Chart/ChartUp.jsx';
import { useCurrency } from '../../../../contexts/CurrencyContext';

const BestPerformer = () => {
  const [bestAsset, setBestAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('hour'); // 'hour' или 'day'
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const { formatPrice, formatChange, getCurrencySymbol } = useCurrency();

  useEffect(() => {
    loadBestPerformer();
  }, [period]);

  const loadBestPerformer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Получаем портфели
      const portfolios = await PortfolioAPI.getPortfolios();
      if (!portfolios || portfolios.length === 0) {
        setError('Нет данных портфеля');
        return;
      }

      // 2. Берем последний портфель
      const latestPortfolio = portfolios[portfolios.length - 1];
      
      // 3. Получаем активы портфеля
      const tableSecurities = await PortfolioAPI.getTableSecurities(latestPortfolio.id || 1);
      if (!tableSecurities || tableSecurities.length === 0) {
        setError('Нет данных об активах');
        return;
      }

      // 4. Для каждого актива получаем биржевые данные и рассчитываем изменения
      const assetsWithChanges = await Promise.all(
        tableSecurities.map(async (asset) => {
          try {
            // Получаем данные об акции
            const stockData = await PortfolioAPI.getStockNameById(asset.securitie_id || asset.id);
            
            if (stockData && stockData.table && stockData.table.length > 0) {
              const priceTable = stockData.table;
              
              // Находим текущую и предыдущую цены в зависимости от периода
              const { currentPrice, previousPrice } = getPricesByPeriod(priceTable, period);
              
              if (currentPrice && previousPrice) {
                const change = currentPrice - previousPrice;
                const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
                
                return {
                  symbol: asset.ticker,
                  name: stockData.name || asset.ticker,
                  currentPrice: currentPrice,
                  previousPrice: previousPrice,
                  change: change,
                  changePercent: changePercent,
                  quantity: asset.quantity
                };
              }
            }
          } catch (err) {
            console.error(`Error loading data for ${asset.ticker}:`, err);
            return null;
          }
          return null;
        })
      );

      // 5. Фильтруем успешно загруженные активы и находим лучший
      const validAssets = assetsWithChanges.filter(asset => asset !== null);
      if (validAssets.length > 0) {
        const best = validAssets.reduce((max, asset) => 
          asset.changePercent > max.changePercent ? asset : max
        );
        setBestAsset(best);
      } else {
        setError('Не удалось загрузить данные цен');
      }

    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения цен в зависимости от периода
  const getPricesByPeriod = (priceTable, periodType) => {
    if (!priceTable || priceTable.length < 2) {
      return { currentPrice: null, previousPrice: null };
    }

    // Сортируем по дате (от новых к старым)
    const sortedTable = [...priceTable].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    if (periodType === 'hour') {
      // Для часового периода берем последние 2 записи
      if (sortedTable.length >= 2) {
        return {
          currentPrice: sortedTable[0].close,
          previousPrice: sortedTable[1].close
        };
      }
    } else if (periodType === 'day') {
      // Для дневного периода ищем цены за вчера и позавчера
      // Или используем разницу между последними доступными днями
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const todayPrice = sortedTable.find(item => 
        item.date.includes(todayStr)
      );
      const yesterdayPrice = sortedTable.find(item => 
        item.date.includes(yesterdayStr)
      );

      if (todayPrice && yesterdayPrice) {
        return {
          currentPrice: todayPrice.close,
          previousPrice: yesterdayPrice.close
        };
      } else if (sortedTable.length >= 2) {
        // Если нет данных за конкретные даты, берем последние доступные
        return {
          currentPrice: sortedTable[0].close,
          previousPrice: sortedTable[1].close
        };
      }
    }

    return { currentPrice: null, previousPrice: null };
  };

  // Функция для переключения периода
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setShowPeriodDropdown(false);
  };

  // Функция для получения текста периода
  const getPeriodText = () => {
    return period === 'hour' ? 'За час' : 'За день';
  };

  if (loading) {
    return (
      <div className="best-performer loading">
        <ChartUp width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="best-performer-title">Лучший актив</h3>
        <div className="best-performer-value">-</div>
        <div className="best-performer-subtitle">Загрузка данных...</div>
      </div>
    );
  }

  if (error || !bestAsset) {
    return (
      <div className="best-performer error">
        <ChartUp width={24} height={24} color="var(--color-error)" />
        <h3 className="best-performer-title">Лучший актив</h3>
        <div className="best-performer-value error">-</div>
        <div className="best-performer-subtitle error">{error || 'Нет данных'}</div>
      </div>
    );
  }

  const isPositive = bestAsset.changePercent >= 0;

  return (
    <div className="best-performer">
      <div className="best-performer-header">
        <ChartUp width={24} height={24} color="var(--color-success)" />
        <h3 className="best-performer-title">Лучший актив</h3>
        
        {/* Выпадающий список для выбора периода */}
        <div className="period-selector">
          <button 
            className="period-dropdown-trigger"
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
          >
            <span>{getPeriodText()}</span>
            <svg 
              className={`dropdown-arrow ${showPeriodDropdown ? 'up' : 'down'}`}
              width="12" 
              height="12" 
              viewBox="0 0 12 12"
            >
              <path 
                d="M3 4.5L6 7.5L9 4.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                fill="none"
              />
            </svg>
          </button>
          
          {showPeriodDropdown && (
            <div className="period-dropdown">
              <button 
                className={`period-option ${period === 'hour' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('hour')}
              >
                За час
              </button>
              <button 
                className={`period-option ${period === 'day' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('day')}
              >
                За день
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="best-performer-content">
        <div className="asset-symbol">{bestAsset.symbol}</div>
        <div className="asset-name">{bestAsset.name}</div>
        
        <div className={`performance-change ${isPositive ? 'positive' : 'negative'}`}>
          {formatChange(bestAsset.change, bestAsset.changePercent, { showPercent: true, decimals: 2 })}
        </div>
      </div>

      <div className="best-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Текущая цена:</span>
            <span className="detail-value">{formatPrice(bestAsset.currentPrice)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">
              {period === 'hour' ? 'Цена час назад:' : 'Цена вчера:'}
            </span>
            <span className="detail-value">{formatPrice(bestAsset.previousPrice)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {formatChange(bestAsset.change, bestAsset.changePercent, { showPercent: false })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformer;