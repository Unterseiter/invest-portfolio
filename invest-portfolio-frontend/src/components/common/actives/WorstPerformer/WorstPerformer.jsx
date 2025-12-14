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

        // 5. Фильтруем успешно загруженные активы и находим ХУДШИЙ
        const validAssets = assetsWithPrices.filter(asset => asset !== null);
        if (validAssets.length > 0) {
          // Ищем актив с минимальным процентом изменения (наибольшим падением)
          const worst = validAssets.reduce((min, asset) => 
            asset.changePercent < min.changePercent ? asset : min
          );
          setWorstAsset(worst);
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

    loadWorstPerformer();
  }, []);

  if (loading) {
    return (
      <div className="worst-performer loading">
        <ChartDown width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="worst-performer-title">Худший актив</h3>
        <div className="worst-performer-value">-</div>
        <div className="worst-performer-subtitle">Загрузка данных...</div>
      </div>
    );
  }

  if (error || !worstAsset) {
    return (
      <div className="worst-performer error">
        <ChartDown width={24} height={24} color="var(--color-error)" />
        <h3 className="worst-performer-title">Худший актив</h3>
        <div className="worst-performer-value error">-</div>
        <div className="worst-performer-subtitle error">{error || 'Нет данных'}</div>
      </div>
    );
  }

  const isPositive = worstAsset.changePercent >= 0;

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
          {formatChange(worstAsset.change, worstAsset.changePercent, { showPercent: true, decimals: 2 })}
        </div>
      </div>

      <div className="worst-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Текущая цена:</span>
            <span className="detail-value">{formatPrice(worstAsset.currentPrice)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Цена покупки:</span>
            <span className="detail-value">{formatPrice(worstAsset.purchasePrice)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {formatChange(worstAsset.change, worstAsset.changePercent, { showPercent: false })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorstPerformer;