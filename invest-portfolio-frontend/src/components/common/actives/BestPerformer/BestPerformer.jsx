import React, { useState, useEffect } from 'react';
import PortfolioAPI from '../../../../test/mockData.js';
import './BestPerformer.css';

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
      <div className="performance-card loading best">
        <div className="performance-header">
          <h3>Лучший актив</h3>
          <div className="performance-badge skeleton-badge">+0%</div>
        </div>
        <div className="asset-info">
          <div className="asset-symbol skeleton-text"></div>
          <div className="asset-name skeleton-text-short"></div>
        </div>
        <div className="performance-details">
          <div className="detail-item skeleton-text"></div>
          <div className="detail-item skeleton-text"></div>
        </div>
      </div>
    );
  }

  if (error || !bestAsset) {
    return (
      <div className="performance-card error best">
        <div className="performance-header">
          <h3>Лучший актив</h3>
          <div className="performance-badge error">-</div>
        </div>
        <div className="error-message">
          {error || 'Нет данных'}
        </div>
      </div>
    );
  }

  const isPositive = bestAsset.changePercent >= 0;

  return (
    <div className="performance-card best">
      <div className="performance-header">
        <h3>Лучший актив</h3>
        <div className={`performance-badge ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{bestAsset.changePercent}%
        </div>
      </div>
      
      <div className="asset-info">
        <div className="asset-symbol">{bestAsset.symbol}</div>
        <div className="asset-name">{bestAsset.name}</div>
      </div>

      <div className="performance-details">
        <div className="detail-item">
          <span className="detail-label">Текущая цена:</span>
          <span className="detail-value">{bestAsset.currentPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Изменение:</span>
          <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{bestAsset.change.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Количество:</span>
          <span className="detail-value">{bestAsset.quantity.toLocaleString('ru-RU')} шт.</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Стоимость:</span>
          <span className="detail-value">{bestAsset.value.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div className="performance-footer">
        <div className="trend-indicator">
          <span className="trend-icon">📈</span>
          <span>Лидер роста</span>
        </div>
      </div>
    </div>
  );
};

export default BestPerformer;