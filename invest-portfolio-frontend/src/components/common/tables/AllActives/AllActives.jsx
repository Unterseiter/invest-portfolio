// AllActives.jsx
import React, { useState, useEffect } from "react";
import { PortfolioAPI } from "../../../../services/portfolioAPI";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import "./AllActives.css";

const AllActives = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({
    securitie_id: "",
    quantity: ""
  });
  const [stockNames, setStockNames] = useState([]);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { formatPrice, convertPrice } = useCurrency();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const portfolios = await PortfolioAPI.getPortfolios();
      let userId = 1;
      if (portfolios && portfolios.length > 0) {
        const latestPortfolio = portfolios[portfolios.length - 1];
        userId = latestPortfolio.id || 1;
      }

      const tableSecurities = await PortfolioAPI.getTableSecurities(userId);
      const stocks = await PortfolioAPI.getStockNames();
      setStockNames(stocks || []);

      if (!tableSecurities || tableSecurities.length === 0) {
        setAssets([]);
        return;
      }

      const assetsWithDetails = [];

      for (const asset of tableSecurities) {
        try {
          // Ищем stock по ticker
          const foundStock = stocks?.find(s => s.name === asset.ticker);
          const securitieId = foundStock?.id || asset.securitie_id || asset.id;

          if (!securitieId) {
            console.warn('Не удалось определить ID для актива:', asset);
            continue;
          }

          let stockData = null;
          let currentPrice = 0;

          try {
            stockData = await PortfolioAPI.getStockNameById(securitieId);
            if (stockData && stockData.table && stockData.table.length > 0) {
              const latestRecord = stockData.table[stockData.table.length - 1];
              currentPrice = latestRecord.close || latestRecord.close_price || 0;
            }
          } catch (apiError) {
            console.error(`Ошибка загрузки данных акции:`, apiError);
          }

          const purchasePrice = asset.price || 0;
          const quantity = asset.quantity || 0;
          const currentValue = currentPrice * quantity;
          const purchaseValue = purchasePrice * quantity;
          const change = currentValue - purchaseValue;
          const changePercent = purchaseValue > 0 ? (change / purchaseValue) * 100 : 0;

          let symbol = asset.ticker || `ID:${securitieId}`;
          let name = foundStock?.full_name || `Актив ${asset.ticker}` || `Актив ${securitieId}`;

          assetsWithDetails.push({
            id: securitieId, // Используем как ID
            securitie_id: securitieId,
            ticker: asset.ticker,
            symbol: symbol,
            name: name,
            quantity: quantity,
            currentPrice: currentPrice,
            purchasePrice: purchasePrice,
            value: currentValue,
            purchaseValue: purchaseValue,
            change: change,
            changePercent: changePercent,
          });

        } catch (err) {
          console.error(`Ошибка обработки актива:`, err);
        }
      }

      setAssets(assetsWithDetails);

    } catch (error) {
      console.error('Ошибка загрузки активов:', error);
      setError(`Не удалось загрузить данные: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ПРОСТАЯ ФУНКЦИЯ УДАЛЕНИЯ - РАБОТАЕТ НА ФРОНТЕНДЕ
  const handleDeleteAsset = async (asset) => {
    if (!asset) {
      alert('Ошибка: данные актива не найдены');
      return;
    }

    const symbol = asset.symbol || asset.ticker || 'актив';
    
    if (!window.confirm(`Удалить актив "${symbol}"?`)) {
      return;
    }

    try {
      setDeletingId(asset.id || asset.ticker);
      
      // Пробуем удалить на бэкенде
      try {
        if (asset.id && asset.id !== 'undefined') {
          await PortfolioAPI.deleteTableSecurity(asset.id);
        }
      } catch (backendError) {
        console.log('Бэкенд удаление не сработало, удаляем только на фронтенде:', backendError.message);
      }
      
      // В ЛЮБОМ СЛУЧАЕ удаляем с фронтенда
      setAssets(prev => prev.filter(a => {
        // Удаляем по всем возможным идентификаторам
        const shouldDelete = 
          (a.id === asset.id) ||
          (a.ticker === asset.ticker) ||
          (a.securitie_id === asset.securitie_id) ||
          (a.symbol === asset.symbol);
        
        return !shouldDelete;
      }));
      
      console.log('Актив удален из интерфейса');
      
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Удаление завершено (только на фронтенде)');
      await loadAssets(); // Перезагружаем на всякий случай
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.securitie_id || !newAsset.quantity) {
      alert("Заполните все поля");
      return;
    }

    try {
      setAdding(true);
      const portfolios = await PortfolioAPI.getPortfolios();
      let userId = 1;
      if (portfolios && portfolios.length > 0) {
        userId = portfolios[portfolios.length - 1].id || 1;
      }

      await PortfolioAPI.addTableSecurity(
        userId,
        parseInt(newAsset.securitie_id),
        parseInt(newAsset.quantity)
      );

      setShowAddForm(false);
      setNewAsset({ securitie_id: "", quantity: "" });
      await loadAssets();

    } catch (error) {
      console.error('Ошибка при добавлении:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setAdding(false);
    }
  };

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    const convertedChange = convertPrice(change);
    
    return (
      <span className={`change-value ${isPositive ? 'change-positive' : 'change-negative'}`}>
        {sign}{Math.abs(convertedChange).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
        {' '}({sign}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка активов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-error">
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <div className="error-title">Ошибка загрузки</div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (assets.length === 0 && !showAddForm) {
    return (
      <div className="table-empty">
        <div className="empty-icon">📊</div>
        <div className="empty-content">
          <div className="empty-title">Таблица активов пуста</div>
          <div className="empty-message">Добавьте активы, чтобы начать отслеживать портфель</div>
          <button
            onClick={() => setShowAddForm(true)}
            className="empty-add-button"
          >
            + Добавить первый актив
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Активы портфеля</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="add-asset-button"
          >
            + Добавить актив
          </button>
        )}
      </div>

      <table className="table-allActives">
        <thead>
          <tr>
            <th>Актив</th>
            <th>Количество</th>
            <th>Цена за шт.</th>
            <th>Стоимость</th>
            <th>Изменение</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {showAddForm && (
            <tr className="add-form-row">
              <td>
                <select
                  value={newAsset.securitie_id}
                  onChange={(e) => setNewAsset({ ...newAsset, securitie_id: e.target.value })}
                  className="asset-select"
                  disabled={adding}
                >
                  <option value="">Выберите актив</option>
                  {stockNames.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name} {stock.full_name ? `(${stock.full_name})` : ''}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={newAsset.quantity}
                  onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })}
                  placeholder="Кол-во"
                  className="quantity-input"
                  min="1"
                  disabled={adding}
                />
              </td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>
                <div className="form-actions">
                  <button
                    onClick={handleAddAsset}
                    disabled={adding}
                    className="form-button form-button--save"
                  >
                    {adding ? '...' : '✓'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    disabled={adding}
                    className="form-button form-button--cancel"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          )}

          {assets.map((asset) => (
            <tr key={asset.id} className={deletingId === asset.id ? 'deleting' : ''}>
              <td>
                <div className="asset-info">
                  <div className="asset-symbol">{asset.symbol}</div>
                  <div className="asset-name">{asset.name}</div>
                </div>
              </td>
              <td className="text-center">{asset.quantity.toLocaleString('ru-RU')}</td>
              <td className="text-center">{formatPrice(asset.currentPrice)}</td>
              <td className="text-center">{formatPrice(asset.value)}</td>
              <td className="text-right">
                {asset.currentPrice > 0 ? formatChange(asset.change, asset.changePercent) : '-'}
              </td>
              <td className="text-center">
                <button
                  onClick={() => handleDeleteAsset(asset)}
                  disabled={deletingId === asset.id}
                  className="delete-button"
                  title="Удалить актив"
                >
                  {deletingId === asset.id ? (
                    <span className="deleting-spinner"></span>
                  ) : (
                    '×'
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllActives;