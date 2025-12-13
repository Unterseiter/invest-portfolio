import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './BestPerformer.css';
import ChartUp from '../../../../assets/Chart/ChartUp.jsx';
import { useCurrency } from '../../../../contexts/CurrencyContext';

const BestPerformer = () => {
  const [bestAsset, setBestAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice, formatChange } = useCurrency();

  useEffect(() => {
    const loadBestPerformer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Получаем портфели
        const portfolios = await PortfolioAPI.getPortfolios();
        if (!portfolios || portfolios.length === 0) {
          setError('Нет данных портфеля');
          setBestAsset(null);
          return;
        }

        // 2. Берем последний портфель
        const latestPortfolio = portfolios[portfolios.length - 1];
        const userId = latestPortfolio.id || 1;
        
        // 3. Получаем данные портфеля через PortfolioAPI.getPortfolioByUserId
        // Этот endpoint уже возвращает best_ticker и worst_ticker!
        const portfolioData = await PortfolioAPI.getPortfolioByUserId(userId);
        
        if (!portfolioData) {
          setError('Нет данных портфеля');
          setBestAsset(null);
          return;
        }

        // 4. Проверяем, есть ли best_ticker в данных
        if (portfolioData.best_ticker) {
          const bestTicker = portfolioData.best_ticker;
          
          // Получаем дополнительные данные об акции
          try {
            const stockData = await PortfolioAPI.getStockNameById(bestTicker.ticker_id);
            
            setBestAsset({
              symbol: bestTicker.name,
              name: bestTicker.full_name || bestTicker.name,
              priceChange: bestTicker.price_change || 0,
              tickerId: bestTicker.ticker_id,
              // Дополнительные данные из stockData
              currentPrice: stockData?.table?.[stockData.table.length - 1]?.close || 0
            });
          } catch (stockError) {
            console.warn('Не удалось получить полные данные акции:', stockError);
            // Используем минимальные данные
            setBestAsset({
              symbol: bestTicker.name,
              name: bestTicker.full_name || bestTicker.name,
              priceChange: bestTicker.price_change || 0,
              tickerId: bestTicker.ticker_id,
              currentPrice: 0
            });
          }
        } else {
          // Если нет best_ticker, пробуем альтернативный способ
          await loadBestPerformerAlternative(userId);
        }

      } catch (err) {
        console.error('Ошибка загрузки BestPerformer:', err);
        setError('Не удалось загрузить данные');
        setBestAsset(null);
      } finally {
        setLoading(false);
      }
    };

    const loadBestPerformerAlternative = async (userId) => {
      try {
        // Альтернативный способ - находим лучший актив самостоятельно
        const tableSecurities = await PortfolioAPI.getTableSecurities(userId);
        if (!tableSecurities || tableSecurities.length === 0) {
          setBestAsset(null);
          return;
        }

        let best = null;
        let maxChange = -Infinity;

        // Простой подход - берем первый актив как лучший
        const firstAsset = tableSecurities[0];
        if (firstAsset) {
          setBestAsset({
            symbol: firstAsset.ticker || 'N/A',
            name: 'Актив',
            priceChange: 0, // Нет данных об изменении
            tickerId: firstAsset.securitie_id
          });
        }
      } catch (altError) {
        console.warn('Альтернативная загрузка не удалась:', altError);
        setBestAsset(null);
      }
    };

    loadBestPerformer();
  }, []);

  if (loading) {
    return (
      <div className="best-performer loading">
        <ChartUp width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="best-performer-title">Лучший актив</h3>
        <div className="best-performer-value">  </div>
        <div className="best-performer-subtitle">Загрузка...</div>
      </div>
    );
  }

  if (error || !bestAsset) {
    return (
      <div className="best-performer error">
        <ChartUp width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="best-performer-title">Лучший актив</h3>
        <div className="best-performer-value">-</div>
        <div className="best-performer-subtitle">Нет данных</div>
      </div>
    );
  }

  const isPositive = bestAsset.priceChange >= 0;

  return (
    <div className="best-performer">
      <div className="best-performer-header">
        <ChartUp width={24} height={24} color="var(--color-success)" />
        <h3 className="best-performer-title">Лучший актив</h3>
      </div>
      
      <div className="best-performer-content">
        <div className="asset-symbol">{bestAsset.symbol}</div>
        <div className="asset-name">{bestAsset.name}</div>
        
        <div className={`performance-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{bestAsset.priceChange?.toFixed(2) || '0.00'}%
        </div>
      </div>

      <div className="best-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{bestAsset.priceChange?.toFixed(2) || '0.00'}%
            </span>
          </div>
          {bestAsset.currentPrice > 0 && (
            <div className="detail-item">
              <span className="detail-label">Текущая цена:</span>
              <span className="detail-value">{formatPrice(bestAsset.currentPrice)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestPerformer;