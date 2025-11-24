import React, { useState } from 'react';
import { PortfolioAPI } from '../../../services/portfolioAPI';

const PortfolioCreator = () => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [status, setStatus] = useState('Готов к работе');
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  };

  const getLastPortfolio = async () => {
    try {
      console.log('🔄 Получаем все портфели...');
      const portfolios = await PortfolioAPI.getPortfolios();
      console.log('📊 Все портфели:', portfolios);
      
      if (portfolios && portfolios.length > 0) {
        const lastPortfolio = portfolios.reduce((max, portfolio) => 
          portfolio.id > max.id ? portfolio : max
        );
        console.log('🎯 Последний портфель:', lastPortfolio);
        return lastPortfolio;
      }
      return null;
    } catch (error) {
      console.error('❌ Ошибка при получении портфелей:', error);
      throw error;
    }
  };

  const getTableSecuritiesSafe = async (userId) => {
    try {
      console.log(`🔍 Ищем активы для портфеля ${userId}...`);
      const assets = await PortfolioAPI.getTableSecurities(userId);
      console.log(`📦 Активы портфеля ${userId}:`, assets);
      return assets || [];
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`ℹ️ Активов для портфеля ${userId} не найдено (404)`);
        return [];
      }
      console.error(`❌ Ошибка при получении активов ${userId}:`, error);
      throw error;
    }
  };

  // Функция для получения securitie_id по тикеру
  const getSecuritieIdByTicker = async (ticker) => {
    try {
      console.log(`🔍 Ищем securitie_id для тикера: ${ticker}`);
      const stockNames = await PortfolioAPI.getStockNames();
      console.log('📊 Все названия акций:', stockNames);
      
      const stock = stockNames.find(s => s.name === ticker);
      if (stock) {
        console.log(`✅ Найден securitie_id: ${stock.id} для тикера ${ticker}`);
        return stock.id;
      } else {
        console.log(`❌ Не найден securitie_id для тикера ${ticker}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Ошибка при поиске securitie_id для ${ticker}:`, error);
      return null;
    }
  };

  const copyAssetsFromPreviousPortfolio = async (newUserId) => {
    try {
      const previousUserId = 1;
      
      console.log(`🔄 Копируем активы из портфеля ${previousUserId} в ${newUserId}`);
      
      const previousAssets = await getTableSecuritiesSafe(previousUserId);
      
      if (previousAssets.length === 0) {
        console.log('📭 Нет активов для копирования');
        return true;
      }

      console.log(`📋 Найдено ${previousAssets.length} активов для копирования:`, previousAssets);

      let successCount = 0;
      let errorCount = 0;

      for (const asset of previousAssets) {
        try {
          console.log(`➡️ Копируем актив:`, asset);
          
          // Получаем securitie_id по тикеру
          const securitie_id = await getSecuritieIdByTicker(asset.ticker);
          
          if (!securitie_id) {
            console.log(`⚠️ Пропускаем актив ${asset.ticker} - не найден securitie_id`);
            continue;
          }

          const quantity = asset.quantity || 1;
          
          console.log(`📤 Данные для создания: user_id=${newUserId}, securitie_id=${securitie_id}, quantity=${quantity}, ticker=${asset.ticker}`);
          
          console.log(`🚀 Вызываем PortfolioAPI.addTableSecurity(${newUserId}, ${securitie_id}, ${quantity})`);
          const result = await PortfolioAPI.addTableSecurity(newUserId, securitie_id, quantity);
          console.log(`✅ Результат создания актива:`, result);
          
          console.log(`✅ Актив скопирован: ${asset.ticker} -> securitie_id=${securitie_id}, quantity=${quantity}`);
          successCount++;
          
        } catch (assetError) {
          console.error(`❌ Ошибка при копировании актива ${asset.ticker}:`, assetError);
          errorCount++;
        }
      }

      console.log(`🎉 ИТОГ: Успешно скопировано ${successCount} из ${previousAssets.length} активов, ошибок: ${errorCount}`);
      return successCount > 0;

    } catch (error) {
      console.error('💥 Критическая ошибка при копировании активов:', error);
      return false;
    }
  };

  const createPortfolioWithAssets = async () => {
    setIsLoading(true);
    setStatus('Создание портфеля...');
    
    try {
      console.log('🚀 НАЧАЛО СОЗДАНИЯ ПОРТФЕЛЯ С АКТИВАМИ');
      
      const currentDateTime = getCurrentDateTime();
      console.log('📅 Текущая дата:', currentDateTime);
      
      console.log('🆕 Создаем новый портфель...');
      const createResult = await PortfolioAPI.createPortfolio(currentDateTime);
      console.log('📝 Результат создания портфеля:', createResult);
      
      if (!createResult.success) {
        throw new Error(createResult.message || 'Ошибка при создании портфеля');
      }

      console.log('🔎 Ищем созданный портфель...');
      const newPortfolio = await getLastPortfolio();
      
      if (!newPortfolio) {
        throw new Error('Не удалось найти созданный портфель');
      }

      const newUserId = newPortfolio.id;
      console.log(`🆔 Создан портфель ID: ${newUserId}`);

      console.log('📦 Начинаем копирование активов...');
      const copySuccess = await copyAssetsFromPreviousPortfolio(newUserId);
      
      if (copySuccess) {
        setStatus(`✅ Успешно! Портфель ${newUserId} создан с активами`);
      } else {
        setStatus(`⚠️ Портфель ${newUserId} создан, но активы не скопированы`);
      }

      setLastUpdate(currentDateTime);

      // Проверяем результат
      console.log('🔍 Проверяем созданные активы...');
      setTimeout(async () => {
        try {
          const createdAssets = await getTableSecuritiesSafe(newUserId);
          console.log(`📊 Активы в новом портфеле ${newUserId}:`, createdAssets);
        } catch (checkError) {
          console.log(`ℹ️ В новом портфеле ${newUserId} активов нет`);
        }
      }, 1000);

    } catch (error) {
      console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
      setStatus(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3>Создание портфеля с активами</h3>
      
      <div style={styles.statusSection}>
        <div style={styles.status}>
          <strong>Статус:</strong> {status}
        </div>
        {lastUpdate && (
          <div style={styles.lastUpdate}>
            <strong>Последнее создание:</strong> {lastUpdate}
          </div>
        )}
      </div>

      <div style={styles.buttonsContainer}>
        <button 
          onClick={createPortfolioWithAssets}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            ...(isLoading ? styles.disabledButton : {})
          }}
        >
          {isLoading ? 'Создание...' : 'Создать портфель с активами'}
        </button>
      </div>

      <div style={styles.info}>
        <p><strong>Новый алгоритм:</strong></p>
        <ol style={styles.list}>
          <li>Создать новый портфель</li>
          <li>Найти активы в портфеле 1 (по тикерам: SBER, etc)</li>
          <li>Для каждого тикера найти соответствующий securitie_id</li>
          <li>Создать активы в новом портфеле с найденными securitie_id</li>
        </ol>
        <p><strong>Откройте Console (F12) для отладки!</strong></p>
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
    maxWidth: '500px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif'
  },
  statusSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #eee'
  },
  status: {
    marginBottom: '10px',
    color: '#333'
  },
  lastUpdate: {
    color: '#666',
    fontSize: '14px'
  },
  buttonsContainer: {
    display: 'flex',
    gap: '10px',
    flexDirection: 'column'
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    cursor: 'not-allowed'
  },
  info: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.4'
  },
  list: {
    margin: '10px 0',
    paddingLeft: '20px'
  }
};

export default PortfolioCreator;