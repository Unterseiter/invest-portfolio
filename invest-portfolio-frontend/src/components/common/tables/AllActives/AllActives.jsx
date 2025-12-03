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

  // После загрузки stockNames добавь:
console.log('Stock names:', stockNames);
// После загрузки stockNames
console.log('Available stocks:', stockNames);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем портфели
        const portfolios = await PortfolioAPI.getPortfolios();
        if (!portfolios || portfolios.length === 0) {
          setError('Нет данных портфеля');
          return;
        }

        // Берем последний портфель
        const latestPortfolio = portfolios[portfolios.length - 1];
        
        // Получаем активы портфеля
        const tableSecurities = await PortfolioAPI.getTableSecurities(latestPortfolio.id || 1);
        
        // Получаем список всех акций для выпадающего списка
        const stocks = await PortfolioAPI.getStockNames();
        setStockNames(stocks || []);

        if (!tableSecurities || tableSecurities.length === 0) {
          setAssets([]);
          return;
        }

        // Для каждого актива получаем текущие цены и рассчитываем изменения
        const assetsWithDetails = await Promise.all(
          tableSecurities.map(async (asset) => {
            try {
              // Получаем данные об акции
              const stockData = await PortfolioAPI.getStockNameById(asset.securitie_id || asset.id);
              
              if (stockData && stockData.table && stockData.table.length > 0) {
                const latestPriceData = stockData.table[stockData.table.length - 1];
                const purchasePrice = asset.price || 0;
                const currentPrice = latestPriceData.close || 0;
                const quantity = asset.quantity || 0;
                const currentValue = currentPrice * quantity;
                const purchaseValue = purchasePrice * quantity;
                const change = currentValue - purchaseValue;
                const changePercent = purchaseValue > 0 ? (change / purchaseValue) * 100 : 0;
                
                return {
                  id: asset.id || asset.ticker,
                  symbol: asset.ticker,
                  name: stockData.name || asset.ticker,
                  quantity: quantity,
                  currentPrice: currentPrice,
                  purchasePrice: purchasePrice,
                  value: currentValue,
                  purchaseValue: purchaseValue,
                  change: change,
                  changePercent: changePercent
                };
              }
            } catch (err) {
              console.error(`Error loading data for ${asset.ticker}:`, err);
              // Возвращаем базовые данные без изменений
              return {
                id: asset.id || asset.ticker,
                symbol: asset.ticker,
                name: asset.ticker,
                quantity: asset.quantity || 0,
                currentPrice: asset.price || 0,
                purchasePrice: asset.price || 0,
                value: asset.sum_price || 0,
                purchaseValue: asset.sum_price || 0,
                change: 0,
                changePercent: 0
              };
            }
            return null;
          })
        );

        // Фильтруем успешно загруженные активы
        const validAssets = assetsWithDetails.filter(asset => asset !== null);
        setAssets(validAssets);

      } catch (error) {
        console.error('Ошибка загрузки активов:', error);
        setError('Не удалось загрузить данные активов');
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Функция для добавления нового актива
  const handleAddAsset = async () => {
  if (!newAsset.securitie_id || !newAsset.quantity) {
    alert("Пожалуйста, заполните все поля");
    return;
  }

  try {
    setAdding(true);
    
    // Получаем текущий портфель
    const portfolios = await PortfolioAPI.getPortfolios();
    if (!portfolios || portfolios.length === 0) {
      throw new Error('Нет активного портфеля');
    }

    const latestPortfolio = portfolios[portfolios.length - 1];
    
    // ИСПРАВЛЕННЫЙ ВЫЗОВ - добавляем userId первым параметром
    await PortfolioAPI.addTableSecurity(
      latestPortfolio.id || 1,  // userId
      parseInt(newAsset.securitie_id),
      parseInt(newAsset.quantity)
    );

    // Обновляем список активов
    const updatedSecurities = await PortfolioAPI.getTableSecurities(latestPortfolio.id || 1);
    
    // Перезагружаем данные
    window.location.reload();
    
  } catch (error) {
    console.error('Ошибка при добавлении актива:', error);
    alert('Не удалось добавить актив: ' + error.message);
  } finally {
    setAdding(false);
    setShowAddForm(false);
    setNewAsset({ securitie_id: "", quantity: "" });
  }
};

  // Функция для форматирования изменения с цветом
  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return (
      <span style={{ color: isPositive ? '#00a86b' : '#ff4444' }}>
        {sign}{change.toLocaleString('ru-RU')} ₽ ({sign}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Загрузка активов...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  // Рассчитываем общую стоимость
  const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchaseValue || 0), 0);
  const totalChange = totalValue - totalPurchaseValue;
  const totalChangePercent = totalPurchaseValue > 0 ? (totalChange / totalPurchaseValue) * 100 : 0;

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
          
          {/* Строка добавления нового актива */}
          {showAddForm ? (
            <tr className="add-asset-form">
              <td>
                <select
                  value={newAsset.securitie_id}
                  onChange={(e) => setNewAsset({...newAsset, securitie_id: e.target.value})}
                  className="asset-select"
                >
                  <option value="">Выберите актив</option>
                  {stockNames.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name} ({stock.id})
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={newAsset.quantity}
                  onChange={(e) => setNewAsset({...newAsset, quantity: e.target.value})}
                  placeholder="Количество"
                  className="quantity-input"
                  min="1"
                />
              </td>
              <td>-</td>
              <td>-</td>
              <td>
                <div className="form-actions">
                  <button 
                    onClick={handleAddAsset}
                    disabled={adding}
                    className="save-btn"
                  >
                    {adding ? 'Добавление...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="cancel-btn"
                  >
                    Отмена
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr className="add-asset-row">
              <td colSpan="5">
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="add-asset-button"
                >
                  + Добавить актив
                </button>
              </td>
            </tr>
          )}
        </tbody>
        
        {/* Подвал с итогами */}
        <tfoot>
          <tr className="total-row">
            <td colSpan="3"><strong>Общая стоимость портфеля:</strong></td>
            <td colSpan="2">
              <strong>
                {totalValue.toLocaleString('ru-RU')} ₽
                <span style={{ 
                  color: totalChange >= 0 ? '#00a86b' : '#ff4444',
                  fontSize: '0.9em',
                  marginLeft: '10px'
                }}>
                  ({totalChange >= 0 ? '+' : ''}{totalChange.toLocaleString('ru-RU')} ₽, 
                  {totalChange >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%)
                </span>
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    
  );
};

export default AllActives;