import React, { useState, useEffect } from 'react';
import PortfolioAPI from '../../../../test/mockData.js';
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
        const assets = await PortfolioAPI.getAssets();
        
        if (assets && assets.length > 0) {
          // Находим актив с максимальным процентом роста
          const best = assets.reduce((max, asset) => 
            asset.changePercent > max.changePercent ? asset : max
          );
          setBestAsset(best);
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
          {isPositive ? '+' : ''}{bestAsset.changePercent}%
        </div>
      </div>

      <div className="best-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Цена:</span>
            <span className="detail-value">{bestAsset.currentPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{bestAsset.change.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformer;