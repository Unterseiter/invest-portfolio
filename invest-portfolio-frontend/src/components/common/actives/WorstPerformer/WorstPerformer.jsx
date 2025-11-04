import React, { useState, useEffect } from 'react';
import PortfolioAPI from '../../../../test/mockData.js';
import './WorstPerformer.css';

const WorstPerformer = () => {
  const [worstAsset, setWorstAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWorstPerformer = async () => {
      try {
        setLoading(true);
        const assets = await PortfolioAPI.getAssets();
        
        if (assets && assets.length > 0) {
          // Находим актив с минимальным процентом роста (наибольшим падением)
          const worst = assets.reduce((min, asset) => 
            asset.changePercent < min.changePercent ? asset : min
          );
          setWorstAsset(worst);
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
      <div className="performance-card loading worst">
        <div className="performance-header">
          <h3>Худший актив</h3>
          <div className="performance-badge skeleton-badge">-0%</div>
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

  if (error || !worstAsset) {
    return (
      <div className="performance-card error worst">
        <div className="performance-header">
          <h3>Худший актив</h3>
          <div className="performance-badge error">-</div>
        </div>
        <div className="error-message">
          {error || 'Нет данных'}
        </div>
      </div>
    );
  }

  const isPositive = worstAsset.changePercent >= 0;

  return (
    <div className="performance-card worst">
      <div className="performance-header">
        <h3>Худший актив</h3>
        <div className={`performance-badge ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{worstAsset.changePercent}%
        </div>
      </div>
      
      <div className="asset-info">
        <div className="asset-symbol">{worstAsset.symbol}</div>
        <div className="asset-name">{worstAsset.name}</div>
      </div>

      <div className="performance-details">
        <div className="detail-item">
          <span className="detail-label">Текущая цена:</span>
          <span className="detail-value">{worstAsset.currentPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Изменение:</span>
          <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{worstAsset.change.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Количество:</span>
          <span className="detail-value">{worstAsset.quantity.toLocaleString('ru-RU')} шт.</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Стоимость:</span>
          <span className="detail-value">{worstAsset.value.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div className="performance-footer">
        <div className="trend-indicator">
          <span className="trend-icon">📉</span>
          <span>Наибольшее падение</span>
        </div>
      </div>
    </div>
  );
};

export default WorstPerformer;