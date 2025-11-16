import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './BestPerformer.css';
import ChartUp from '../../../../assets/Chart/ChartUp.jsx';

const BestPerformer = () => {
  const [bestAsset, setBestAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

        // 4. Для каждого актива получаем текущие биржевые данные
        const assetsWithPrices = await Promise.all(
          tableSecurities.map(async (asset) => {
            try {
              // Получаем данные об акции
              const stockData = await PortfolioAPI.getStockNameById(asset.securitie_id || asset.id);
              
              if (stockData && stockData.table && stockData.table.length > 0) {
                const latestPriceData = stockData.table[stockData.table.length - 1];
                const purchasePrice = asset.price || 0;
                const currentPrice = latestPriceData.close || 0;
                const change = currentPrice - purchasePrice;
                const changePercent = purchasePrice > 0 ? (change / purchasePrice) * 100 : 0;
                
                return {
                  symbol: asset.ticker,
                  name: stockData.name || asset.ticker,
                  currentPrice: currentPrice,
                  purchasePrice: purchasePrice,
                  change: change,
                  changePercent: changePercent,
                  quantity: asset.quantity
                };
              }
            } catch (err) {
              console.error(`Error loading data for ${asset.ticker}:`, err);
              return null;
            }
            return null;
          })
        );

        // 5. Фильтруем успешно загруженные активы и находим лучший
        const validAssets = assetsWithPrices.filter(asset => asset !== null);
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

    loadBestPerformer();
  }, []);

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
      </div>
      
      <div className="best-performer-content">
        <div className="asset-symbol">{bestAsset.symbol}</div>
        <div className="asset-name">{bestAsset.name}</div>
        
        <div className={`performance-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{bestAsset.changePercent.toFixed(2)}%
        </div>
      </div>

      <div className="best-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Текущая цена:</span>
            <span className="detail-value">{bestAsset.currentPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Цена покупки:</span>
            <span className="detail-value">{bestAsset.purchasePrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{bestAsset.change.toFixed(2)} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformer;