import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './BestPerformer.css';
import ChartUp from '../../../../assets/Chart/ChartUp.jsx';
import { useCurrency } from '../../../../contexts/CurrencyContext';

const BestPerformer = () => {
  const [bestAsset, setBestAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const loadBestPerformer = async () => {
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

        // 5. Ищем лучший актив (наибольшее положительное изменение)
        let bestAssetInfo = assetsInfo[0];
        
        // Если есть положительные изменения, берем максимальное положительное
        const positiveAssets = assetsInfo.filter(a => a.priceChange > 0);
        if (positiveAssets.length > 0) {
          // Лучший актив - с максимальным положительным изменением
          bestAssetInfo = positiveAssets.reduce((best, current) => 
            current.priceChange > best.priceChange ? current : best
          );
        } else {
          // Если все активы отрицательные, берем "наименее плохой" (максимальное из отрицательных)
          bestAssetInfo = assetsInfo.reduce((best, current) => 
            current.priceChange > best.priceChange ? current : best
          );
        }

        // 6. Формируем данные для отображения
        const assetToDisplay = {
          symbol: bestAssetInfo.symbol,
          name: bestAssetInfo.name || bestAssetInfo.symbol,
          priceChange: bestAssetInfo.priceChange || 0,
          tickerId: bestAssetInfo.tickerId,
          currentPrice: bestAssetInfo.currentPrice || 0
        };

        setBestAsset(assetToDisplay);
        setError(null);

      } catch (err) {
        console.error('Критическая ошибка загрузки BestPerformer:', err);
        setError('Не удалось загрузить данные');
        setBestAsset(null);
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
        <div className="best-performer-subtitle">{error || 'Нет данных'}</div>
      </div>
    );
  }

  const isPositive = bestAsset.priceChange > 0;
  const isNegative = bestAsset.priceChange < 0;

  return (
    <div className="best-performer">
      <div className="best-performer-header">
        <ChartUp width={24} height={24} color={isPositive ? "var(--color-success)" : "var(--color-error)"} />
        <h3 className="best-performer-title">Лучший актив</h3>
      </div>
      
      <div className="best-performer-content">
        <div className="asset-symbol">{bestAsset.symbol}</div>
        <div className="asset-name">{bestAsset.name}</div>
        
        <div className={`performance-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
          {bestAsset.priceChange > 0 ? '+' : ''}{bestAsset.priceChange?.toFixed(2) || '0.00'}%
        </div>
      </div>

      <div className="best-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
              {bestAsset.priceChange > 0 ? '+' : ''}{bestAsset.priceChange?.toFixed(2) || '0.00'}%
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