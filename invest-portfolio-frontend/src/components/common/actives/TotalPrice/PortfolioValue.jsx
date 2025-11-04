import React, { useState, useEffect } from "react";
import { PortfolioAPI } from "../../../../test/mockData";
import "./PortfolioValue.css";
import ChartUp from "../../../../assets/Chart/ChartUp";
import ChartDown from "../../../../assets/Chart/ChartDown";

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

  if (loading) {
    return (
      <div className="portfolio-value loading">
        <ChartUp width={40} height={40} color="var(--color-tertiary)" />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  const isPositive = portfolio.dailyChange >= 0;

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
          ${portfolio.totalValue.toLocaleString()}
        </div>

        <div className={`change ${isPositive ? "positive" : "negative"}`}>
          <span className="change-amount">
            {isPositive ? "+" : ""}
            {portfolio.dailyChange}
          </span>
          <span className="change-percent">
            ({isPositive ? "+" : ""}
            {portfolio.dailyChangePercent}%)
          </span>
        </div>
      </div>
      <div className="portfolio-period">Обновлено сегодня</div>
    </div>
  );
};

export default PortfolioValue;
