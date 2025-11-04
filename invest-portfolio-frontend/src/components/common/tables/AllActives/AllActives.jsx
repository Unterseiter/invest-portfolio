import React, { useState, useEffect } from "react";
import PortfolioAPI from "../../../../test/mockData.js";
import "./AllActives.css";

const AllActives = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const assetsData = await PortfolioAPI.getAssets();
        setAssets(assetsData);
      } catch (error) {
        console.error('Ошибка загрузки активов:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Функция для форматирования изменения с цветом
  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return (
      <span style={{ color: isPositive ? '#00a86b' : '#ff4444' }}>
        {sign}{change.toLocaleString('ru-RU')} ₽ ({sign}{changePercent}%)
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Загрузка активов...</div>;
  }

  return (
    <div className="table-container">
      <table className="table-allActives">
        <thead>
          <tr>
            <th>Актив</th>
            <th>Количество</th>
            <th>Цена за шт.</th>
            <th>Стоимость</th>
            <th>Изменение</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>
                <div className="asset-info">
                  <div className="asset-symbol">{asset.symbol}</div>
                  <div className="asset-name">{asset.name}</div>
                </div>
              </td>
              <td>{asset.quantity.toLocaleString('ru-RU')}</td>
              <td>{asset.currentPrice.toLocaleString('ru-RU')} ₽</td>
              <td>{asset.value.toLocaleString('ru-RU')} ₽</td>
              <td>{formatChange(asset.change, asset.changePercent)}</td>
            </tr>
          ))}
        </tbody>
        {/* Подвал с итогами */}
        <tfoot>
          <tr className="total-row">
            <td colSpan="3"><strong>Общая стоимость:</strong></td>
            <td colSpan="2">
              <strong>
                {assets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString('ru-RU')} ₽
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AllActives;