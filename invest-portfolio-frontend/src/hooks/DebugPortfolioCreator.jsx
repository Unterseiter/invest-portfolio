// components/DebugPortfolioCreator.jsx
import React, { useState } from 'react';
import { PortfolioAPI } from '../services/portfolioAPI';

const DebugPortfolioCreator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [createdPortfolio, setCreatedPortfolio] = useState(null);

  // Функция для добавления логов
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  };

  const getLastPortfolio = async () => {
    try {
      addLog('🔄 Получаем все портфели...', 'process');
      const portfolios = await PortfolioAPI.getPortfolios();
      addLog(`📊 Найдено портфелей: ${portfolios?.length || 0}`, 'data');
      
      if (portfolios && portfolios.length > 0) {
        const lastPortfolio = portfolios.reduce((max, portfolio) => 
          portfolio.id > max.id ? portfolio : max
        );
        addLog(`🎯 Последний портфель: ID=${lastPortfolio.id}, дата=${lastPortfolio.date}`, 'success');
        return lastPortfolio;
      }
      addLog('❌ Портфели не найдены', 'error');
      return null;
    } catch (error) {
      addLog(`❌ Ошибка при получении портфелей: ${error.message}`, 'error');
      throw error;
    }
  };

  const getTableSecuritiesSafe = async (userId) => {
    try {
      addLog(`🔍 Ищем активы для портфеля ${userId}...`, 'process');
      const assets = await PortfolioAPI.getTableSecurities(userId);
      addLog(`📦 Найдено активов: ${assets?.length || 0}`, 'data');
      return assets || [];
    } catch (error) {
      if (error.message.includes('404')) {
        addLog(`ℹ️ Активов для портфеля ${userId} не найдено`, 'info');
        return [];
      }
      addLog(`❌ Ошибка при получении активов ${userId}: ${error.message}`, 'error');
      throw error;
    }
  };

  const getSecuritieIdByTicker = async (ticker) => {
    try {
      addLog(`🔍 Ищем securitie_id для тикера: ${ticker}`, 'process');
      const stockNames = await PortfolioAPI.getStockNames();
      addLog(`📊 Всего названий акций: ${stockNames?.length || 0}`, 'data');
      
      const stock = stockNames.find(s => s.name === ticker);
      if (stock) {
        addLog(`✅ Найден securitie_id: ${stock.id} для тикера ${ticker}`, 'success');
        return stock.id;
      } else {
        addLog(`❌ Не найден securitie_id для тикера ${ticker}`, 'error');
        return null;
      }
    } catch (error) {
      addLog(`❌ Ошибка при поиске securitie_id для ${ticker}: ${error.message}`, 'error');
      return null;
    }
  };

  const copyAssetsFromPreviousPortfolio = async (newUserId) => {
    try {
      const previousUserId = newUserId - 1;
      
      addLog(`🔄 Копируем активы из портфеля ${previousUserId} в ${newUserId}`, 'process');
      
      const previousAssets = await getTableSecuritiesSafe(previousUserId);
      
      if (previousAssets.length === 0) {
        addLog('📭 Нет активов для копирования', 'info');
        return { success: true, copied: 0, total: 0, assets: [] };
      }

      addLog(`📋 Найдено ${previousAssets.length} активов для копирования`, 'data');

      let successCount = 0;
      let errorCount = 0;
      const copiedAssets = [];

      for (const asset of previousAssets) {
        try {
          addLog(`➡️ Копируем актив: ${asset.ticker} (количество: ${asset.quantity})`, 'process');
          
          // Получаем securitie_id по тикеру
          const securitie_id = await getSecuritieIdByTicker(asset.ticker);
          
          if (!securitie_id) {
            addLog(`⚠️ Пропускаем актив ${asset.ticker} - не найден securitie_id`, 'warning');
            continue;
          }

          const quantity = asset.quantity || 1;
          
          addLog(`📤 Создаем актив: user_id=${newUserId}, securitie_id=${securitie_id}, quantity=${quantity}`, 'process');
          
          const result = await PortfolioAPI.addTableSecurity(newUserId, securitie_id, quantity);
          addLog(`✅ Актив создан: ${asset.ticker}`, 'success');
          
          copiedAssets.push({
            ticker: asset.ticker,
            securitie_id,
            quantity,
            original: asset
          });
          successCount++;
          
        } catch (assetError) {
          addLog(`❌ Ошибка при копировании актива ${asset.ticker}: ${assetError.message}`, 'error');
          errorCount++;
        }
      }

      addLog(`🎉 ИТОГ: Успешно скопировано ${successCount} из ${previousAssets.length} активов, ошибок: ${errorCount}`, 
        successCount > 0 ? 'success' : 'error');
      
      return { 
        success: successCount > 0, 
        copied: successCount, 
        total: previousAssets.length,
        errors: errorCount,
        assets: copiedAssets
      };

    } catch (error) {
      addLog(`💥 Критическая ошибка при копировании активов: ${error.message}`, 'error');
      return { success: false, copied: 0, total: 0, errors: 1, assets: [] };
    }
  };

  const createPortfolioWithAssets = async () => {
    setIsLoading(true);
    setLogs([]);
    setResult(null);
    setCreatedPortfolio(null);
    
    try {
      addLog('🚀 НАЧАЛО СОЗДАНИЯ ПОРТФЕЛЯ С АКТИВАМИ', 'process');
      
      const currentDateTime = getCurrentDateTime();
      addLog(`📅 Текущая дата: ${currentDateTime}`, 'data');
      
      addLog('🆕 Создаем новый портфель...', 'process');
      const createResult = await PortfolioAPI.createPortfolio(currentDateTime);
      addLog(`📝 Результат создания портфеля: ${JSON.stringify(createResult)}`, 'data');
      
      if (!createResult.success) {
        throw new Error(createResult.message || 'Ошибка при создании портфеля');
      }

      addLog('🔎 Ищем созданный портфель...', 'process');
      const newPortfolio = await getLastPortfolio();
      
      if (!newPortfolio) {
        throw new Error('Не удалось найти созданный портфель');
      }

      const newUserId = newPortfolio.id;
      addLog(`🆔 Создан портфель ID: ${newUserId}`, 'success');
      setCreatedPortfolio(newPortfolio);

      addLog('📦 Начинаем копирование активов...', 'process');
      const copyResult = await copyAssetsFromPreviousPortfolio(newUserId);
      
      // Сохраняем полный результат
      const finalResult = {
        success: true,
        portfolioId: newUserId,
        dateTime: currentDateTime,
        assets: copyResult,
        message: copyResult.success 
          ? `Портфель ${newUserId} создан с ${copyResult.copied} активами`
          : `Портфель ${newUserId} создан, но активы не скопированы`
      };
      
      setResult(finalResult);
      addLog(`✅ ${finalResult.message}`, 'success');

      // Проверяем результат через секунду
      setTimeout(async () => {
        try {
          const createdAssets = await getTableSecuritiesSafe(newUserId);
          addLog(`📊 Активы в новом портфеле ${newUserId}: ${createdAssets.length}`, 'data');
          if (createdAssets.length > 0) {
            addLog('📋 Детали активов:', 'data');
            createdAssets.forEach(asset => {
              addLog(`   - ${asset.ticker}: ${asset.quantity} шт.`, 'data');
            });
          }
        } catch (checkError) {
          addLog(`ℹ️ В новом портфеле ${newUserId} активов нет`, 'info');
        }
      }, 1000);

    } catch (error) {
      addLog(`💥 КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`, 'error');
      setResult({
        success: false,
        error: error.message,
        message: `Ошибка: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResult(null);
    setCreatedPortfolio(null);
  };

  const getLogStyle = (type) => {
    const styles = {
      process: { color: '#007bff', fontWeight: 'bold' },
      data: { color: '#6c757d' },
      success: { color: '#28a745', fontWeight: 'bold' },
      error: { color: '#dc3545', fontWeight: 'bold' },
      warning: { color: '#ffc107', fontWeight: 'bold' },
      info: { color: '#17a2b8' }
    };
    return styles[type] || styles.info;
  };

  return (
    <div style={styles.container}>
      <h3>🔧 Отладочное создание портфеля</h3>
      
      <div style={styles.controls}>
        <button 
          onClick={createPortfolioWithAssets}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(isLoading ? styles.disabledButton : styles.primaryButton)
          }}
        >
          {isLoading ? '🔄 Создание...' : '🚀 Запустить создание портфеля'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={styles.secondaryButton}
        >
          🧹 Очистить логи
        </button>
      </div>

      {/* Результат */}
      {result && (
        <div style={styles.resultSection}>
          <h4>📊 Результат:</h4>
          <div style={{
            ...styles.resultBox,
            ...(result.success ? styles.successBox : styles.errorBox)
          }}>
            <strong>Статус:</strong> {result.success ? '✅ Успешно' : '❌ Ошибка'}<br/>
            <strong>Сообщение:</strong> {result.message}<br/>
            {result.portfolioId && <><strong>ID портфеля:</strong> {result.portfolioId}<br/></>}
            {result.dateTime && <><strong>Время:</strong> {result.dateTime}<br/></>}
            {result.assets && (
              <>
                <strong>Активы:</strong> {result.assets.copied} из {result.assets.total} скопировано<br/>
                <strong>Ошибки:</strong> {result.assets.errors}
              </>
            )}
          </div>
        </div>
      )}

      {/* Созданный портфель */}
      {createdPortfolio && (
        <div style={styles.portfolioSection}>
          <h4>📁 Созданный портфель:</h4>
          <div style={styles.dataBox}>
            <pre>{JSON.stringify(createdPortfolio, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Логи */}
      <div style={styles.logsSection}>
        <h4>📝 Логи процесса ({logs.length} записей):</h4>
        <div style={styles.logsContainer}>
          {logs.length === 0 ? (
            <div style={styles.emptyLogs}>Логов пока нет. Нажмите кнопку для запуска.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={styles.logEntry}>
                <span style={styles.timestamp}>[{log.timestamp}]</span>
                <span style={getLogStyle(log.type)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    maxWidth: '800px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  button: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    color: 'white'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    color: '#666',
    cursor: 'not-allowed'
  },
  resultSection: {
    marginBottom: '20px'
  },
  resultBox: {
    padding: '15px',
    borderRadius: '5px',
    marginTop: '10px',
    lineHeight: '1.5'
  },
  successBox: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724'
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24'
  },
  portfolioSection: {
    marginBottom: '20px'
  },
  dataBox: {
    padding: '15px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginTop: '10px',
    fontSize: '12px',
    maxHeight: '200px',
    overflow: 'auto'
  },
  logsSection: {
    marginBottom: '20px'
  },
  logsContainer: {
    maxHeight: '400px',
    overflow: 'auto',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '10px'
  },
  emptyLogs: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    padding: '20px'
  },
  logEntry: {
    padding: '5px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '12px',
    lineHeight: '1.4'
  },
  timestamp: {
    color: '#999',
    marginRight: '10px',
    fontSize: '11px'
  }
};

export default DebugPortfolioCreator;