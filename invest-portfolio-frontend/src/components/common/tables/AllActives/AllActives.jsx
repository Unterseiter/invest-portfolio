// AllActives.jsx
import React, { useState, useEffect } from "react";
import { PortfolioAPI } from "../../../../services/portfolioAPI";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import ConfirmModal from "../../modal/confirmDelete/ConfirmModal";
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Состояния для модального окна
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  
  // Состояние для отображения уведомления
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const { formatPrice, convertPrice } = useCurrency();

  useEffect(() => {
    loadAssets();
    
    // Автообновление каждые 30 секунд
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        if (!loading && !adding && !deletingId) {
          console.log('Автообновление данных...');
          loadAssets(true);
        }
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh]);

  // Показать уведомление
  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Функция получения правильной цены покупки
  const getPurchasePrice = async (securitieId, purchaseDate = null) => {
    try {
      // Здесь нужно получить историческую цену на дату покупки
      // Если дата покупки не передана, используем текущую дату минус 7 дней (пример)
      const stockData = await PortfolioAPI.getStockNameById(securitieId);
      
      if (!stockData || !stockData.table || stockData.table.length === 0) {
        return 0;
      }
      
      // Если есть дата покупки, находим ближайшую цену к этой дате
      if (purchaseDate) {
        const purchaseTimestamp = new Date(purchaseDate).getTime();
        const closestPrice = stockData.table.reduce((prev, curr) => {
          const currTimestamp = new Date(curr.date).getTime();
          const prevTimestamp = new Date(prev.date).getTime();
          return Math.abs(currTimestamp - purchaseTimestamp) < Math.abs(prevTimestamp - purchaseTimestamp) 
            ? curr 
            : prev;
        });
        return closestPrice.close || 0;
      }
      
      // Если нет даты покупки, берем самую старую цену
      return stockData.table[0]?.close || 0;
    } catch (error) {
      console.error('Ошибка получения цены покупки:', error);
      return 0;
    }
  };

  // Основная функция загрузки данных
  const loadAssets = async (forceReload = false, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      if (forceReload) {
        setAssets([]);
      }

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
        setShowAddForm(false);
        return;
      }

      const assetsWithDetails = [];

      for (const asset of tableSecurities) {
        try {
          // Ищем stock по ticker или securitie_id
          const foundStock = stocks?.find(s => 
            s.name === asset.ticker || s.id === asset.securitie_id
          );
          const securitieId = foundStock?.id || asset.securitie_id || asset.id;

          if (!securitieId) {
            console.warn('Не удалось определить ID для актива:', asset);
            continue;
          }

          let stockData = null;
          let currentPrice = 0;
          let purchasePrice = 0;

          try {
            // Получаем данные акции
            stockData = await PortfolioAPI.getStockNameById(securitieId);
            if (stockData && stockData.table && stockData.table.length > 0) {
              // Текущая цена - последняя запись
              const latestRecord = stockData.table[stockData.table.length - 1];
              currentPrice = latestRecord.close || latestRecord.close_price || 0;
              
              // Цена покупки - самая старая запись или с даты покупки
              purchasePrice = await getPurchasePrice(securitieId, asset.purchase_date);
            }
          } catch (apiError) {
            console.error(`Ошибка загрузки данных акции:`, apiError);
          }

          // Если не удалось получить цену покупки из истории, используем текущую как fallback
          if (purchasePrice === 0 && currentPrice > 0) {
            purchasePrice = currentPrice * 0.95; // Примерное снижение на 5%
          }

          const quantity = asset.quantity || 0;
          const currentValue = currentPrice * quantity;
          const purchaseValue = purchasePrice * quantity;
          const change = currentValue - purchaseValue;
          const changePercent = purchaseValue > 0 ? (change / purchaseValue) * 100 : 0;

          // Определяем символ и название
          let symbol = asset.ticker || foundStock?.name || `ID:${securitieId}`;
          let name = foundStock?.full_name || `Актив ${symbol}`;

          assetsWithDetails.push({
            id: asset.id || securitieId,
            securitie_id: securitieId,
            original_id: asset.id,
            ticker: symbol,
            symbol: symbol,
            name: name,
            quantity: quantity,
            currentPrice: currentPrice,
            purchasePrice: purchasePrice,
            value: currentValue,
            purchaseValue: purchaseValue,
            change: change,
            changePercent: changePercent,
            purchase_date: asset.purchase_date || null,
            last_updated: new Date().toISOString()
          });

        } catch (err) {
          console.error(`Ошибка обработки актива:`, err);
        }
      }

      setAssets(assetsWithDetails);

    } catch (error) {
      console.error('Ошибка загрузки активов:', error);
      setError(`Не удалось загрузить данные: ${error.message}`);
      if (!silent) {
        showNotification('Ошибка загрузки данных', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ: Создание нового портфеля без удаляемого актива
  const deleteAssetViaNewPortfolio = async (asset) => {
    try {
      setDeletingId(asset.id);
      showNotification('Начинаем удаление...', 'info');

      // 1. Получаем текущий портфель
      const portfolios = await PortfolioAPI.getPortfolios();
      if (portfolios.length === 0) {
        throw new Error('Портфель не найден');
      }
      
      const currentPortfolio = portfolios[portfolios.length - 1];
      const currentUserId = currentPortfolio.id || 1;
      
      // 2. Получаем ВСЕ активы текущего портфеля
      const currentAssets = await PortfolioAPI.getTableSecurities(currentUserId);

      if (!currentAssets || currentAssets.length === 0) {
        throw new Error('Активы портфеля не найдены');
      }

      // 3. Фильтруем активы - убираем удаляемый
      const assetsToKeep = currentAssets.filter(currentAsset => {
        const isSameAsset = 
          currentAsset.securitie_id === asset.securitie_id ||
          currentAsset.securitie_id === parseInt(asset.securitie_id) ||
          currentAsset.ticker === asset.ticker ||
          (currentAsset.id && currentAsset.id === asset.original_id);
        
        return !isSameAsset;
      });

      // 4. Создаем новую дату для портфеля
      const newDate = new Date().toISOString().split('T')[0];
      
      // 5. Создаем НОВЫЙ портфель
      await PortfolioAPI.createPortfolio(newDate);
      
      // 6. Получаем ID нового портфеля
      const updatedPortfolios = await PortfolioAPI.getPortfolios();
      const newPortfolio = updatedPortfolios[updatedPortfolios.length - 1];
      const newUserId = newPortfolio.id;

      // 7. Добавляем все активы КРОМЕ удаляемого в новый портфель
      for (const assetToKeep of assetsToKeep) {
        try {
          await PortfolioAPI.addTableSecurity(
            newUserId,
            assetToKeep.securitie_id,
            assetToKeep.quantity
          );
        } catch (addError) {
          console.error(`Ошибка при добавлении ${assetToKeep.ticker}:`, addError);
        }
      }

      // 8. (Опционально) Удаляем старый портфель
      try {
        await PortfolioAPI.deletePortfolio(currentUserId);
      } catch (deleteError) {
        console.warn('Не удалось удалить старый портфель:', deleteError);
      }

      // 9. Полностью перезагружаем данные
      await loadAssets(true);
      
      // 10. Показываем успешное уведомление
      showNotification(`Актив "${asset.symbol || asset.ticker}" успешно удален!`, 'success');

    } catch (error) {
      console.error('❌ Ошибка при удалении через новый портфель:', error);
      
      const errorMessage = error.message || 'Неизвестная ошибка';
      showNotification(`Ошибка: ${errorMessage}`, 'error');
      
      // Удаляем из локального состояния
      setAssets(prev => prev.filter(a => a.securitie_id !== asset.securitie_id));
      
      // Пробуем перезагрузить данные
      setTimeout(() => {
        loadAssets();
      }, 1000);
      
    } finally {
      setDeletingId(null);
      setAssetToDelete(null);
      setShowConfirmModal(false);
    }
  };

  // Обработчик клика на кнопку удаления
  const handleDeleteClick = (asset) => {
    setAssetToDelete(asset);
    setShowConfirmModal(true);
  };

  // Подтверждение удаления
  const handleConfirmDelete = () => {
    if (assetToDelete) {
      deleteAssetViaNewPortfolio(assetToDelete);
    }
  };

  // Функция добавления актива
  const handleAddAsset = async () => {
    if (!newAsset.securitie_id || !newAsset.quantity) {
      showNotification("Заполните все поля", "error");
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
      await loadAssets(false, true); // Бесшумное обновление
      showNotification("Актив успешно добавлен", "success");

    } catch (error) {
      console.error('Ошибка при добавлении:', error);
      showNotification('Ошибка при добавления: ' + error.message, "error");
    } finally {
      setAdding(false);
    }
  };

  // Форматирование изменения цены
  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    const convertedChange = convertPrice(change);
    
    return (
      <div className="change-display">
        <span className={`change-value ${isPositive ? 'change-positive' : 'change-negative'}`}>
          {sign}{Math.abs(convertedChange).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
        </span>
        <small>
          ({sign}{changePercent.toFixed(2)}%)
        </small>
      </div>
    );
  };

  // Компонент уведомления
  const Notification = () => {
    if (!notification.show) return null;
    
    const bgColor = notification.type === 'error' ? 'var(--color-error)' :
                   notification.type === 'success' ? 'var(--color-success)' :
                   'var(--color-accent)';
    
    return (
      <div 
        className="notification"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: bgColor,
          color: 'white',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-medium)',
          zIndex: 1001,
          animation: 'slideIn 0.3s ease'
        }}
      >
        {notification.message}
      </div>
    );
  };

  // Кнопка ручного обновления
  const handleManualRefresh = () => {
    showNotification("Обновление данных...", "info");
    loadAssets(true);
  };

  // Переключение автообновления
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    showNotification(!autoRefresh ? "Автообновление включено" : "Автообновление выключено", "info");
  };

  if (loading && assets.length === 0) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка активов...</div>
      </div>
    );
  }

  // Отображение пустого состояния с возможностью добавления
  if (assets.length === 0) {
    return (
      <div className="table-empty-with-form">
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        <Notification />
        
        <div className="empty-state-with-form">
          <div className="empty-content">
            <div className="empty-icon">📊</div>
            <div className="empty-title">Портфель пуст</div>
            <div className="empty-message">
              Добавьте активы, чтобы начать отслеживать портфель
            </div>
            
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="empty-add-button"
              >
                + Добавить первый актив
              </button>
            ) : (
              <div className="add-form-section">
                <div className="add-form-title">Добавить актив</div>
                <div className="add-form-container">
                  <div className="form-row">
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
                  </div>
                  <div className="form-row">
                    <input
                      type="number"
                      value={newAsset.quantity}
                      onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })}
                      placeholder="Количество"
                      className="quantity-input"
                      min="1"
                      disabled={adding}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={handleAddAsset}
                      disabled={adding || !newAsset.securitie_id || !newAsset.quantity}
                      className="form-button form-button--save"
                    >
                      {adding ? 'Добавление...' : 'Добавить'}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      disabled={adding}
                      className="form-button form-button--cancel"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && assets.length === 0) {
    return (
      <div className="table-error">
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <div className="error-title">Ошибка загрузки</div>
          <div className="error-message">{error}</div>
          <button onClick={() => loadAssets(true)} className="reload-button">
            Повторить
          </button>
        </div>
      </div>
    );
  }

  // Расчет итогов
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const totalChange = totalValue - totalPurchaseValue;
  const totalChangePercent = totalPurchaseValue > 0 ? (totalChange / totalPurchaseValue) * 100 : 0;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .change-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .change-display small {
          font-size: 0.8em;
          opacity: 0.8;
          margin-top: 2px;
        }
        
        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--color-secondary);
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border-secondary);
          transition: .4s;
          border-radius: 34px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: var(--color-accent);
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
      `}</style>
      
      <Notification />
      
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Активы портфеля</h2>
          <div className="header-actions">
            <div className="auto-refresh-toggle">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoRefresh}
                  onChange={toggleAutoRefresh}
                />
                <span className="toggle-slider"></span>
              </label>
              <span>Автообновление</span>
            </div>
            
            <button
              onClick={handleManualRefresh}
              className="reload-button"
              title="Обновить данные"
              disabled={deletingId}
            >
              ↻
            </button>
            
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="add-asset-button"
                disabled={deletingId}
              >
                + Добавить актив
              </button>
            )}
          </div>
        </div>

        <table className="table-allActives">
          <thead>
            <tr>
              <th>Актив</th>
              <th>Количество</th>
              <th>Текущая цена</th>
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
                    disabled={adding || deletingId}
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
                    disabled={adding || deletingId}
                  />
                </td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>
                  <div className="form-actions">
                    <button
                      onClick={handleAddAsset}
                      disabled={adding || deletingId}
                      className="form-button form-button--save"
                    >
                      {adding ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      disabled={adding || deletingId}
                      className="form-button form-button--cancel"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {assets.map((asset) => (
              <tr key={`${asset.id}-${asset.ticker}`} className={deletingId === asset.id ? 'deleting' : ''}>
                <td>
                  <div className="asset-info">
                    <div className="asset-symbol">{asset.symbol}</div>
                    <div className="asset-name">{asset.name}</div>
                  </div>
                </td>
                <td className="text-center">{asset.quantity.toLocaleString('ru-RU')}</td>
                <td className="text-center">{formatPrice(asset.currentPrice)}</td>
                <td className="text-center">{formatPrice(asset.value)}</td>
                <td className="text-center">
                  {asset.currentPrice > 0 ? formatChange(asset.change, asset.changePercent) : '-'}
                </td>
                <td className="text-center">
                  <button
                    onClick={() => handleDeleteClick(asset)}
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
          
          <tfoot>
            <tr>
              <td colSpan="3" className="total-label">
                <strong>Итого:</strong>
              </td>
              <td className="text-center">
                <strong>{formatPrice(totalValue)}</strong>
              </td>
              <td className="text-right">
                <div className="change-display">
                  <span className={`change-value ${totalChange >= 0 ? 'change-positive' : 'change-negative'}`}>
                    {totalChange >= 0 ? '+' : ''}{Math.abs(totalChange).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </span>
                  <small>
                    ({totalChange >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%)
                  </small>
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setAssetToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Удаление актива"
        message={`Вы уверены, что хотите удалить актив "${assetToDelete?.symbol || assetToDelete?.ticker || 'актив'}"? 
Это действие создаст новый портфель без этого актива.`}
      />
    </>
  );
};

export default AllActives;