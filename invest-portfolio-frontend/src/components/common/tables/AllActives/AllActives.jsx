// AllActives.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userId, setUserId] = useState(1);
  
  // Состояние для отображения уведомления
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const { formatPrice, convertPrice } = useCurrency();

  // Функция загрузки userId из портфелей
  const loadUserId = useCallback(async () => {
    try {
      const portfolios = await PortfolioAPI.getPortfolios();
      if (portfolios && portfolios.length > 0) {
        const latestPortfolio = portfolios[portfolios.length - 1];
        return latestPortfolio.id || 1;
      }
      return 1;
    } catch (error) {
      console.error('Ошибка загрузки userId:', error);
      return 1;
    }
  }, []);

  // Основная функция загрузки данных
  const loadAssets = useCallback(async (forceReload = false, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      if (forceReload) {
        setAssets([]);
      }

      // Загружаем userId
      const currentUserId = await loadUserId();
      setUserId(currentUserId);

      // Загружаем названия акций
      const stocks = await PortfolioAPI.getStockNames();
      setStockNames(stocks || []);

      // Загружаем активы пользователя
      const tableSecurities = await PortfolioAPI.getTableSecurities(currentUserId);
      
      console.log('Загруженные активы:', tableSecurities);
      console.log('Количество активов:', tableSecurities?.length || 0);

      if (!tableSecurities || tableSecurities.length === 0) {
        setAssets([]);
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

          try {
            // Получаем данные акции
            stockData = await PortfolioAPI.getStockNameById(securitieId);
            if (stockData && stockData.table && stockData.table.length > 0) {
              // Текущая цена - последняя запись
              const latestRecord = stockData.table[stockData.table.length - 1];
              currentPrice = latestRecord.close || latestRecord.close_price || 0;
            }
          } catch (apiError) {
            console.error(`Ошибка загрузки данных акции:`, apiError);
          }

          const quantity = asset.quantity || 0;
          const currentValue = currentPrice * quantity;
          
          // Для расчета изменения используем среднюю цену или первую доступную цену
          let purchasePrice = 0;
          if (stockData && stockData.table && stockData.table.length > 0) {
            // Берем среднюю цену как пример
            const prices = stockData.table.map(item => item.close || 0);
            purchasePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          }
          
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
  }, [loadUserId]);

  useEffect(() => {
    loadAssets();
    
    // Автообновление каждые 30 секунд
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        if (!loading && !adding && !deletingId) {
          loadAssets(true, true); // Бесшумное обновление
        }
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, loadAssets]);

  // Показать уведомление
  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Функция добавления актива
  const handleAddAsset = async () => {
    if (!newAsset.securitie_id || !newAsset.quantity) {
      showNotification("Заполните все поля", "error");
      return;
    }

    if (parseInt(newAsset.quantity) <= 0) {
      alert("Количество должно быть больше 0");
      return;
    }

    try {
      setAdding(true);
      
      // Получаем текущий userId
      const currentUserId = await loadUserId();
      
      console.log('Добавление актива:', {
        userId: currentUserId,
        securitie_id: newAsset.securitie_id,
        quantity: newAsset.quantity
      });

      await PortfolioAPI.addTableSecurity(
        currentUserId,
        parseInt(newAsset.securitie_id),
        parseInt(newAsset.quantity)
      );

      // Сбрасываем форму
      setNewAsset({ securitie_id: "", quantity: "" });
      
      // Закрываем форму добавления
      setShowAddForm(false);
      
      // Загружаем обновленные данные
      await loadAssets(true);
      
      showNotification("Актив успешно добавлен", "success");

    } catch (error) {
      console.error('Ошибка при добавлении:', error);
      showNotification('Ошибка при добавлении: ' + error.message, "error");
    } finally {
      setAdding(false);
    }
  };

  // Обработчик удаления актива
  const deleteAssetViaNewPortfolio = async (asset) => {
    if (!window.confirm(`Удалить актив "${asset.symbol || asset.ticker}"? Это действие создаст новый портфель без этого актива.`)) {
      return;
    }

    try {
      setDeletingId(asset.id);
      showNotification('Начинаем удаление...', 'info');

      // Получаем текущий userId
      const currentUserId = await loadUserId();
      
      // Получаем все активы
      const currentAssets = await PortfolioAPI.getTableSecurities(currentUserId);

      // Фильтруем активы - убираем удаляемый
      const assetsToKeep = currentAssets.filter(currentAsset => {
        const isSameAsset = 
          currentAsset.securitie_id === asset.securitie_id ||
          currentAsset.securitie_id === parseInt(asset.securitie_id) ||
          currentAsset.ticker === asset.ticker ||
          (currentAsset.id && currentAsset.id === asset.original_id);
        
        return !isSameAsset;
      });

      // Создаем новую дату для портфеля
      const newDate = new Date().toISOString().split('T')[0];
      
      // Создаем новый портфель
      await PortfolioAPI.createPortfolio(newDate);
      
      // Получаем ID нового портфеля
      const updatedPortfolios = await PortfolioAPI.getPortfolios();
      const newPortfolio = updatedPortfolios[updatedPortfolios.length - 1];
      const newUserId = newPortfolio.id;

      // Добавляем все активы кроме удаляемого в новый портфель
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

      // Удаляем старый портфель
      try {
        await PortfolioAPI.deletePortfolio(currentUserId);
      } catch (deleteError) {
        console.warn('Не удалось удалить старый портфель:', deleteError);
      }

      // Загружаем обновленные данные
      await loadAssets(true);
      
      showNotification(`Актив "${asset.symbol || asset.ticker}" успешно удален!`, 'success');

    } catch (error) {
      console.error('Ошибка при удалении:', error);
      const errorMessage = error.message || 'Неизвестная ошибка';
      showNotification(`Ошибка: ${errorMessage}`, 'error');
      
      // Пробуем перезагрузить данные
      setTimeout(() => {
        loadAssets();
      }, 1000);
      
    } finally {
      setDeletingId(null);
    }
  };

  // Форматирование изменения цены
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

  // Кнопка ручного обновления
  const handleManualRefresh = () => {
    showNotification("Обновление данных...", "info");
    loadAssets(true);
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

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка активов...</div>
      </div>
    );
  }

  // Если нет активов, показываем форму добавления первого актива
  if (assets.length === 0) {
    return (
      <>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        
        <Notification />
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">Активы портфеля</h2>
          </div>

          {!showAddForm ? (
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
          ) : (
            <>
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
                        step="1"
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
                          onClick={() => {
                            setShowAddForm(false);
                            setNewAsset({ securitie_id: "", quantity: "" });
                          }}
                          disabled={adding}
                          className="form-button form-button--cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="table-hint">
                <p>Выберите актив из списка и укажите количество</p>
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        
        <Notification />
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">Активы портфеля</h2>
            <button
              onClick={loadAssets}
              className="add-asset-button"
            >
              ↻ Обновить
            </button>
          </div>
          <div className="table-empty">
            <div className="empty-icon">⚠️</div>
            <div className="empty-content">
              <div className="empty-title">Ошибка загрузки</div>
              <div className="empty-message">{error}</div>
              <button
                onClick={loadAssets}
                className="empty-add-button"
              >
                ↻ Повторить попытку
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <Notification />
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Активы портфеля</h2>
          <div className="header-actions">
            <button
              onClick={handleManualRefresh}
              className="reload-button"
              title="Обновить данные"
              disabled={deletingId}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-sm)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all var(--transition-fast)',
                marginRight: '8px'
              }}
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
                    step="1"
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
                      disabled={adding || deletingId || !newAsset.securitie_id || !newAsset.quantity}
                      className="form-button form-button--save"
                    >
                      {adding ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewAsset({ securitie_id: "", quantity: "" });
                      }}
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
                <td className="text-center">
                  {asset.currentPrice > 0 ? formatPrice(asset.currentPrice) : '-'}
                </td>
                <td className="text-center">
                  {asset.value > 0 ? formatPrice(asset.value) : '-'}
                </td>
                <td className="text-right">
                  {asset.currentPrice > 0 && asset.purchasePrice > 0 ? (
                    formatChange(asset.change, asset.changePercent)
                  ) : (
                    '-'
                  )}
                </td>
                <td className="text-center">
                  <button
                    onClick={() => deleteAssetViaNewPortfolio(asset)}
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
        
        {assets.length > 0 && (
          <div className="table-footer">
            <div className="table-total">
              <div className="total-label">Общая стоимость:</div>
              <div className="total-value">
                {formatPrice(assets.reduce((sum, asset) => sum + (asset.value || 0), 0))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AllActives;