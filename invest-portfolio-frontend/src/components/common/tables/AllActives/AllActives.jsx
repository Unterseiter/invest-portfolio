import React, { useState, useEffect } from "react";
import { PortfolioAPI } from "../../../../services/portfolioAPI";
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

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем портфели
      const portfolios = await PortfolioAPI.getPortfolios();
      
      let userId = 1; // По умолчанию
      if (portfolios && portfolios.length > 0) {
        const latestPortfolio = portfolios[portfolios.length - 1];
        userId = latestPortfolio.id || 1;
      }
      
      // Получаем активы портфеля
      const tableSecurities = await PortfolioAPI.getTableSecurities(userId);
      
      // Получаем список всех акций для выпадающего списка
      const stocks = await PortfolioAPI.getStockNames();
      setStockNames(stocks || []);

      // Если активов нет
      if (!tableSecurities || tableSecurities.length === 0) {
        setAssets([]);
        return;
      }

      console.log('Загружено активов:', tableSecurities.length);
      console.log('Данные активов:', tableSecurities);

      // Обрабатываем активы с получением текущих цен
      const assetsWithDetails = [];
      
      for (const asset of tableSecurities) {
        try {
          console.log('Обработка актива:', asset);
          
          // Определяем ID акции
          let securitieId = null;
          
          if (asset.securitie_id && asset.securitie_id !== 'undefined') {
            securitieId = asset.securitie_id;
          } else if (asset.id && asset.id !== 'undefined') {
            securitieId = asset.id;
          } else if (asset.ticker) {
            // Если есть ticker, ищем в списке акций
            const foundStock = stocks?.find(s => s.name === asset.ticker);
            securitieId = foundStock?.id;
          }
          
          if (!securitieId) {
            console.warn('Не удалось определить ID для актива:', asset);
            continue;
          }
          
          console.log('Используем securitieId:', securitieId);
          
          // Получаем данные об акции с ценами
          let stockData = null;
          let currentPrice = 0;
          
          try {
            stockData = await PortfolioAPI.getStockNameById(securitieId);
            console.log('Данные акции для ID', securitieId, ':', stockData);
            
            // Извлекаем текущую цену
            if (stockData && stockData.table && stockData.table.length > 0) {
              // Получаем последнюю запись с ценой закрытия
              const latestRecord = stockData.table[stockData.table.length - 1];
              currentPrice = latestRecord.close || latestRecord.close_price || 0;
              console.log('Текущая цена для', securitieId, ':', currentPrice);
            }
          } catch (apiError) {
            console.error(`Ошибка загрузки данных акции для ID ${securitieId}:`, apiError);
          }
          
          const purchasePrice = asset.price || 0;
          const quantity = asset.quantity || 0;
          
          const currentValue = currentPrice * quantity;
          const purchaseValue = purchasePrice * quantity;
          const change = currentValue - purchaseValue;
          const changePercent = purchaseValue > 0 ? (change / purchaseValue) * 100 : 0;
          
          // Определяем название актива
          let symbol = '';
          let name = '';
          
          if (stockData) {
            symbol = stockData.name || stockData.ticker || `ID:${securitieId}`;
            name = stockData.full_name || stockData.name || `Актив ${securitieId}`;
          } else if (asset.ticker) {
            symbol = asset.ticker;
            name = `Актив ${asset.ticker}`;
          } else {
            symbol = `ID:${securitieId}`;
            name = `Актив ${securitieId}`;
          }
          
          assetsWithDetails.push({
            id: asset.id || securitieId,
            securitie_id: securitieId,
            symbol: symbol,
            name: name,
            quantity: quantity,
            currentPrice: currentPrice,
            purchasePrice: purchasePrice,
            value: currentValue,
            purchaseValue: purchaseValue,
            change: change,
            changePercent: changePercent,
            tableSecurityId: asset.id // Для удаления
          });
          
        } catch (err) {
          console.error(`Ошибка обработки актива:`, err);
          console.error('Данные актива:', asset);
        }
      }

      console.log('Обработанные активы:', assetsWithDetails);
      setAssets(assetsWithDetails);

    } catch (error) {
      console.error('Полная ошибка загрузки активов:', error);
      setError(`Не удалось загрузить данные активов: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Удаление актива
  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот актив?')) {
      return;
    }

    try {
      setDeletingId(id);
      await PortfolioAPI.deleteTableSecurity(id);
      await loadAssets(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка при удалении актива:', error);
      alert('Не удалось удалить актив');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.securitie_id || !newAsset.quantity) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    try {
      setAdding(true);
      
      const portfolios = await PortfolioAPI.getPortfolios();
      let userId = 1;
      if (portfolios && portfolios.length > 0) {
        const latestPortfolio = portfolios[portfolios.length - 1];
        userId = latestPortfolio.id || 1;
      }
      
      await PortfolioAPI.addTableSecurity(
        userId,
        parseInt(newAsset.securitie_id),
        parseInt(newAsset.quantity)
      );

      setShowAddForm(false);
      setNewAsset({ securitie_id: "", quantity: "" });
      await loadAssets(); // Перезагружаем данные
      
    } catch (error) {
      console.error('Ошибка при добавлении актива:', error);
      alert('Не удалось добавить актив: ' + error.message);
    } finally {
      setAdding(false);
    }
  };

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return (
      <span className={`change-value ${isPositive ? 'change-positive' : 'change-negative'}`}>
        {sign}{change.toLocaleString('ru-RU')} ₽ ({sign}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  // Форматирование цены
  const formatPrice = (price) => {
    if (!price || price === 0) return '-';
    return `${price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
  };

  // Если загрузка
  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка активов...</div>
      </div>
    );
  }

  // Если ошибка
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

  // Если нет активов
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

  // Рассчитываем общую стоимость
  // const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  // const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchaseValue || 0), 0);
  // const totalChange = totalValue - totalPurchaseValue;
  // const totalChangePercent = totalPurchaseValue > 0 ? (totalChange / totalPurchaseValue) * 100 : 0;

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
          {/* Строка добавления нового актива */}
          {showAddForm && (
            <tr className="add-form-row">
              <td>
                <select
                  value={newAsset.securitie_id}
                  onChange={(e) => setNewAsset({...newAsset, securitie_id: e.target.value})}
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
                  onChange={(e) => setNewAsset({...newAsset, quantity: e.target.value})}
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

          {/* Существующие активы */}
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
                  onClick={() => handleDeleteAsset(asset.tableSecurityId)}
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