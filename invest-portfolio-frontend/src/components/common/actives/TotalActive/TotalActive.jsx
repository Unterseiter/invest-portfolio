import React, { useState, useEffect } from "react";
import PortfolioAPI from "../../../../test/mockData";
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
        // Загружаем активы и сектора одновременно
        const [assetsData, sectorsData] = await Promise.all([
          PortfolioAPI.getAssets(),
          PortfolioAPI.getSectorAllocation(),
        ]);

        setAssets(assetsData);
        setSectors(sectorsData);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Получаем уникальные сектора из активов
  const uniqueSectorsCount = sectors.length;

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
        <div className="total-active-value">{assets.length}</div>
        <div className="total-active-subtitle">
          {uniqueSectorsCount > 0
            ? `В ${uniqueSectorsCount} ${getSectorWord(uniqueSectorsCount)} экономики`
            : "Нет данных о секторах"}
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
          Диверсификация: {Math.min(uniqueSectorsCount, 10)}+ секторов
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция для склонения слова "сектор"
const getSectorWord = (count) => {
  if (count % 10 === 1 && count % 100 !== 11) return "секторе";
  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 10 || count % 100 >= 20)
  )
    return "секторах";
  return "секторах";
};

export default TotalActive;