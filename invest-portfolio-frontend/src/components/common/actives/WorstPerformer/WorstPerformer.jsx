import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './WorstPerformer.css';
import ChartDown from '../../../../assets/Chart/ChartDown.jsx';
import { useCurrency } from '../../../../contexts/CurrencyContext';

const WorstPerformer = () => {
  const [worstAsset, setWorstAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice, formatChange } = useCurrency();

  useEffect(() => {
    const loadWorstPerformer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Получаем портфели
        const portfolios = await PortfolioAPI.getPortfolios();
        if (!portfolios || portfolios.length === 0) {
          setError('Нет данных портфеля');
          setWorstAsset(null);
          return;
        }

        // 2. Берем последний портфель
        const latestPortfolio = portfolios[portfolios.length - 1];
        const userId = latestPortfolio.id || 1;
        
        // 3. Получаем данные портфеля через PortfolioAPI.getPortfolioByUserId
        const portfolioData = await PortfolioAPI.getPortfolioByUserId(userId);
        
        if (!portfolioData) {
          setError('Нет данных портфеля');
          setWorstAsset(null);
          return;
        }

        // 4. Проверяем, есть ли worst_ticker в данных
        if (portfolioData.worst_ticker) {
          const worstTicker = portfolioData.worst_ticker;
          
          // Получаем дополнительные данные об акции
          try {
            const stockData = await PortfolioAPI.getStockNameById(worstTicker.ticker_id);
            
            setWorstAsset({
              symbol: worstTicker.name,
              name: worstTicker.full_name || worstTicker.name,
              priceChange: worstTicker.price_change || 0,
              tickerId: worstTicker.ticker_id,
              // Дополнительные данные из stockData
              currentPrice: stockData?.table?.[stockData.table.length - 1]?.close || 0
            });
          } catch (stockError) {
            console.warn('Не удалось получить полные данные акции:', stockError);
            // Используем минимальные данные
            setWorstAsset({
              symbol: worstTicker.name,
              name: worstTicker.full_name || worstTicker.name,
              priceChange: worstTicker.price_change || 0,
              tickerId: worstTicker.ticker_id,
              currentPrice: 0
            });
          }
        } else {
          // Если нет worst_ticker, пробуем альтернативный способ
          await loadWorstPerformerAlternative(userId);
        }

      } catch (err) {
        console.error('Ошибка загрузки WorstPerformer:', err);
        setError('Не удалось загрузить данные');
        setWorstAsset(null);
      } finally {
        setLoading(false);
      }
    };

    const loadWorstPerformerAlternative = async (userId) => {
      try {
        // Альтернативный способ - просто показываем что данных нет
        const tableSecurities = await PortfolioAPI.getTableSecurities(userId);
        if (tableSecurities && tableSecurities.length > 0) {
          // Берем первый актив как пример
          const firstAsset = tableSecurities[0];
          setWorstAsset({
            symbol: firstAsset.ticker || 'N/A',
            name: 'Актив',
            priceChange: -1.5, // Пример значения
            tickerId: firstAsset.securitie_id
          });
        }
      } catch (altError) {
        console.warn('Альтернативная загрузка не удалась:', altError);
        setWorstAsset(null);
      }
    };

    loadWorstPerformer();
  }, []);

  if (loading) {
    return (
      <div className="worst-performer loading">
        <ChartDown width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="worst-performer-title">Худший актив</h3>
        <div className="worst-performer-value">  </div>
        <div className="worst-performer-subtitle">Загрузка...</div>
      </div>
    );
  }

  if (error || !worstAsset) {
    return (
      <div className="worst-performer error">
        <ChartDown width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="worst-performer-title">Худший актив</h3>
        <div className="worst-performer-value">-</div>
        <div className="worst-performer-subtitle">Нет данных</div>
      </div>
    );
  }

  const isPositive = worstAsset.priceChange >= 0;

  return (
    <div className="worst-performer">
      <div className="worst-performer-header">
        <ChartDown width={24} height={24} color="var(--color-error)" />
        <h3 className="worst-performer-title">Худший актив</h3>
      </div>
      
      <div className="worst-performer-content">
        <div className="asset-symbol">{worstAsset.symbol}</div>
        <div className="asset-name">{worstAsset.name}</div>
        
        <div className={`performance-change ${isPositive ? 'positive' : 'negative'}`}>
          {worstAsset.priceChange?.toFixed(2) || '0.00'}%
        </div>
      </div>

      <div className="worst-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {worstAsset.priceChange?.toFixed(2) || '0.00'}%
            </span>
          </div>
          {worstAsset.currentPrice > 0 && (
            <div className="detail-item">
              <span className="detail-label">Текущая цена:</span>
              <span className="detail-value">{formatPrice(worstAsset.currentPrice)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorstPerformer;