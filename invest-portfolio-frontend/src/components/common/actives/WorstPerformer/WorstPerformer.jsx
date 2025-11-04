import React, { useState, useEffect } from 'react';
import PortfolioAPI from '../../../../test/mockData.js';
import './WorstPerformer.css';
import ChartDown from '../../../../assets/Chart/ChartDown.jsx';

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
          {isPositive ? '+' : ''}{worstAsset.changePercent}%
        </div>
      </div>

      <div className="worst-performer-footer">
        <div className="performance-details">
          <div className="detail-item">
            <span className="detail-label">Цена:</span>
            <span className="detail-value">{worstAsset.currentPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Изменение:</span>
            <span className={`detail-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{worstAsset.change.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorstPerformer;