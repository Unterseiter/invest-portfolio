import React, { useState, useEffect } from "react";
import { PortfolioAPI } from "../../../../services/portfolioAPI"; // ПРАВИЛЬНЫЙ ПУТЬ К API
import "./TotalActive.css";
import ChartUp from "../../../../assets/Chart/ChartUp";

const TotalActive = () => {
  const [assets, setAssets] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем данные из реального API
        // Получаем все портфели и берем последний
        const portfolios = await PortfolioAPI.getPortfolios();
        
        if (portfolios && portfolios.length > 0) {
          const latestPortfolio = portfolios[portfolios.length - 1];
          
          // Получаем таблицу активов для последнего портфеля
          const tableSecurities = await PortfolioAPI.getTableSecurities(latestPortfolio.id || 1);
          setAssets(tableSecurities || []);
          
          // Для секторов используем данные из stock_names
          // В реальном API может не быть секторов, поэтому используем тикеры как "сектора"
          const stockNames = await PortfolioAPI.getStockNames();
          const uniqueTickers = [...new Set(tableSecurities?.map(asset => asset.ticker) || [])];
          setSectors(uniqueTickers);
        } else {
          setAssets([]);
          setSectors([]);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить данные");
        setAssets([]);
        setSectors([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Получаем уникальные сектора (в данном случае - уникальные тикеры)
  const uniqueSectorsCount = sectors.length;
  const totalAssetsCount = assets.length;

  if (loading) {
    return (
      <div className="total-active loading">
        <ChartUp width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="total-active-title">Количество активов</h3>
        <div className="total-active-value">-</div>
        <div className="total-active-subtitle">Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="total-active error">
        <ChartUp width={24} height={24} color="var(--color-error)" />
        <h3 className="total-active-title">Количество активов</h3>
        <div className="total-active-value error">0</div>
        <div className="total-active-subtitle error">{error}</div>
      </div>
    );
  }

  return (
    <div className="total-active">
      <div className="total-active-header">
        <ChartUp width={24} height={24} color="var(--color-accent)" />
        <h3 className="total-active-title">Количество активов</h3>
      </div>
      
      <div className="total-active-content">
        <div className="total-active-value">{totalAssetsCount}</div>
        <div className="total-active-subtitle">
          {uniqueSectorsCount > 0
            ? `${uniqueSectorsCount} ${getSectorWord(uniqueSectorsCount)}`
            : "Нет данных о компаниях"}
        </div>
      </div>

      <div className="total-active-footer">
        <div className="diversification-indicator">
          <div 
            className="diversification-bar" 
            style={{ width: `${Math.min((uniqueSectorsCount / 10) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="diversification-label">
          Компаний: {uniqueSectorsCount}
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция для склонения слова "компания"
const getSectorWord = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastDigit === 1 && lastTwoDigits !== 11) return "компания";
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) return "компании";
  return "компаний";
};

export default TotalActive;