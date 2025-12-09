// PortfolioValue.jsx
import React, { useState, useEffect } from "react";
import { PortfolioAPI } from "../../../../services/portfolioAPI";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import "./PortfolioValue.css";
import ChartUp from "../../../../assets/Chart/ChartUp";
import ChartDown from "../../../../assets/Chart/ChartDown";

const PortfolioValue = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice, formatChange } = useCurrency();

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const portfolios = await PortfolioAPI.getPortfolios();
        
        if (portfolios && portfolios.length > 0) {
          const latestPortfolio = portfolios[portfolios.length - 1];
          
          let dailyChange = 0;
          let dailyChangePercent = 0;
          
          if (portfolios.length > 1) {
            const previousPortfolio = portfolios[portfolios.length - 2];
            const currentValue = latestPortfolio.total_value || 0;
            const previousValue = previousPortfolio.total_value || 0;
            
            dailyChange = currentValue - previousValue;
            dailyChangePercent = previousValue > 0 ? 
              ((dailyChange / previousValue) * 100) : 0;
          }
          
          const portfolioData = {
            totalValue: latestPortfolio.total_value || 0,
            dailyChange: dailyChange,
            dailyChangePercent: dailyChangePercent,
            date: latestPortfolio.date,
            totalStocks: latestPortfolio.total_stocks || 0
          };
          
          setPortfolio(portfolioData);
        } else {
          setPortfolio({
            totalValue: 0,
            dailyChange: 0,
            dailyChangePercent: 0,
            date: new Date().toISOString(),
            totalStocks: 0
          });
        }
      } catch (error) {
        console.error("Error loading portfolio:", error);
        setError(error.message);
        setPortfolio({
          totalValue: 0,
          dailyChange: 0,
          dailyChangePercent: 0,
          date: new Date().toISOString(),
          totalStocks: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="portfolio-value loading">
        <ChartUp width={40} height={40} color="var(--color-tertiary)" />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error && (!portfolio || portfolio.totalValue === 0)) {
    return (
      <div className="portfolio-value error">
        <ChartDown width={40} height={40} color="var(--color-error)" />
        <p>Ошибка загрузки</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Повторить
        </button>
      </div>
    );
  }

  const isPositive = portfolio.dailyChange >= 0;

  const formatUpdateDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Обновлено сегодня";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Обновлено вчера";
      } else {
        return `Обновлено ${date.toLocaleDateString("ru-RU")}`;
      }
    } catch (e) {
      return "Обновлено недавно";
    }
  };

  return (
    <div className="portfolio-value">
      <div className="portfolio-header">
        {isPositive ? (
          <ChartUp width={24} height={24} color="var(--color-success)" />
        ) : (
          <ChartDown width={24} height={24} color="var(--color-error)" />
        )}
        <h3 className="portfolio-title">Стоимость портфеля</h3>
      </div>
      <div className="portfolio-content">
        <div className="total-value">
          {formatPrice(portfolio.totalValue)}
        </div>

        <div className={`change ${isPositive ? "positive" : "negative"}`}>
          {formatChange(portfolio.dailyChange, portfolio.dailyChangePercent)}
        </div>
      </div>
      <div className="portfolio-period">
        {formatUpdateDate(portfolio.date)}
      </div>
      {portfolio.totalStocks > 0 && (
        <div className="portfolio-stocks">
          Активов: {portfolio.totalStocks}
        </div>
      )}
    </div>
  );
};

export default PortfolioValue;