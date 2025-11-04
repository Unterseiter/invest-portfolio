import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../test/mockData';
import './TotalPrice.css';

const PortfolioValue = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      const data = await PortfolioAPI.getPortfolioOverview();
      setPortfolio(data);
      setLoading(false);
    };
    loadPortfolio();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="portfolio-value">
      <h2>Стоимость портфеля</h2>
      <div className="total-value">${portfolio.totalValue.toLocaleString()}</div>
      <div className={`change ${portfolio.dailyChange >= 0 ? 'positive' : 'negative'}`}>
        {portfolio.dailyChange >= 0 ? '+' : ''}{portfolio.dailyChange} 
        ({portfolio.dailyChangePercent}%)
      </div>
    </div>
  );
};

export default PortfolioValue;