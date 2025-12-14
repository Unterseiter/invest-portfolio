import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './WorstPerformer.css';
import ChartDown from '../../../../assets/Chart/ChartDown.jsx';
import { useCurrency } from '../../../../contexts/CurrencyContext';

const WorstPerformer = () => {
  const [worstAsset, setWorstAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const loadWorstPerformer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Получаем портфели
        const portfolios = await PortfolioAPI.getPortfolios();
        
        if (!portfolios || portfolios.length === 0) {
          setError('Нет данных портфеля');
          setLoading(false);
          return;
        }

        // 2. Берем последний портфель
        const latestPortfolio = portfolios[portfolios.length - 1];
        const userId = latestPortfolio.id || 1;
        
        // 3. Получаем данные портфеля
        const portfolioData = await PortfolioAPI.getPortfolioByUserId(userId);
        
        if (!portfolioData || !portfolioData.table || portfolioData.table.length === 0) {
          setError('Нет данных активов в портфеле');
          setLoading(false);
          return;
        }

        // 4. Для каждого тикера получаем полную информацию
        const assetsInfo = [];
        
        for (const asset of portfolioData.table) {
          try {
            const assetInfo = await PortfolioAPI.getAssetFullInfoByTicker(asset.ticker);
            
            if (assetInfo) {
              assetsInfo.push({
                ...assetInfo,
                quantity: asset.quantity,
                purchasePrice: asset.price,
                sumPrice: asset.sum_price
              });
            }
          } catch (err) {
            console.warn(`Ошибка загрузки данных для ${asset.ticker}:`, err);
          }
        }

        if (assetsInfo.length === 0) {
          setError('Не удалось получить данные активов');
          setLoading(false);
          return;
        }

        // 5. Ищем худший актив (наименьшее отрицательное изменение)
        let worstAssetInfo = assetsInfo[0];
        
        // Если есть отрицательные изменения, берем минимальное (самое отрицательное)
        const negativeAssets = assetsInfo.filter(a => a.priceChange < 0);
        if (negativeAssets.length > 0) {
          // Худший актив - с минимальным (самым отрицательным) изменением
          worstAssetInfo = negativeAssets.reduce((worst, current) => 
            current.priceChange < worst.priceChange ? current : worst
          );
        } else {
          // Если все активы положительные, берем "наименее хороший" (минимальное из положительных)
          worstAssetInfo = assetsInfo.reduce((worst, current) => 
            current.priceChange < worst.priceChange ? current : worst
          );
        }

        // 6. Формируем данные для отображения
        const assetToDisplay = {
          symbol: worstAssetInfo.symbol,
          name: worstAssetInfo.name || worstAssetInfo.symbol,
          priceChange: worstAssetInfo.priceChange || 0,
          tickerId: worstAssetInfo.tickerId,
          currentPrice: worstAssetInfo.currentPrice || 0
        };

        setWorstAsset(assetToDisplay);
        setError(null);

      } catch (err) {
        console.error('Критическая ошибка загрузки WorstPerformer:', err);
        setError('Не удалось загрузить данные');
        setWorstAsset(null);
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
        <div className="worst-performer-subtitle">{error || 'Нет данных'}</div>
      </div>
    );
  }

  const isPositive = worstAsset.priceChange > 0;
  const isNegative = worstAsset.priceChange < 0;

  return (
    <div className="worst-performer">
      <div className="worst-performer-header">
        <ChartDown width={24} height={24} color={isNegative ? "var(--color-error)" : "var(--color-success)"} />
        <h3 className="worst-performer-title">Худший актив</h3>
      </div>
      
      <div className="worst-performer-content">
        <div className="asset-symbol">{worstAsset.symbol}</div>
        <div className="asset-name">{worstAsset.name}</div>
        
        <div className={`performance-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
          {worstAsset.priceChange > 0 ? '+' : ''}{worstAsset.priceChange?.toFixed(2) || '0.00'}%
        </div>
      </div>

      <div className="worst-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
              {worstAsset.priceChange > 0 ? '+' : ''}{worstAsset.priceChange?.toFixed(2) || '0.00'}%
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