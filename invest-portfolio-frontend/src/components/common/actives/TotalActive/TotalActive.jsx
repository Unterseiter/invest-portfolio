import React, { useState, useEffect } from "react";
import PortfolioAPI from "../../../../test/mockData";
import "./TotalActive.css";

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
      <div className="portfolio-actives loading">
        <h2>Количество активов</h2>
        <div className="total-actives skeleton">-</div>
        <div className="second-total-actives skeleton-text">
          Загрузка данных...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-actives error">
        <h2>Количество активов</h2>
        <div className="total-actives error">0</div>
        <div className="second-total-actives error">{error}</div>
      </div>
    );
  }

  return (
    <div className="portfolio-actives">
      <h2>Количество активов</h2>
      <div className="total-actives">{assets.length}</div>
      <div className="second-total-actives">
        {uniqueSectorsCount > 0
          ? `В ${uniqueSectorsCount} ${getSectorWord(
              uniqueSectorsCount
            )} экономики`
          : "Нет данных о секторах"}
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
