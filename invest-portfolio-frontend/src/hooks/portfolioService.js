// utils/portfolioService.js
import { PortfolioAPI } from '../services/portfolioAPI';

export const portfolioService = {
  // Основная функция создания портфеля с активами
  createPortfolioWithAssets: async () => {
    try {
      console.log('🚀 НАЧАЛО СОЗДАНИЯ ПОРТФЕЛЯ С АКТИВАМИ');
      
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
            return { success: true, copied: 0, total: 0 };
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
          return { 
            success: successCount > 0, 
            copied: successCount, 
            total: previousAssets.length,
            errors: errorCount
          };

        } catch (error) {
          console.error('💥 Критическая ошибка при копировании активов:', error);
          return { success: false, copied: 0, total: 0, errors: 1 };
        }
      };

      // Основная логика
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
      const copyResult = await copyAssetsFromPreviousPortfolio(newUserId);
      
      // Проверяем результат через секунду
      setTimeout(async () => {
        try {
          const createdAssets = await getTableSecuritiesSafe(newUserId);
          console.log(`📊 Активы в новом портфеле ${newUserId}:`, createdAssets);
        } catch (checkError) {
          console.log(`ℹ️ В новом портфеле ${newUserId} активов нет`);
        }
      }, 1000);

      return {
        success: true,
        portfolioId: newUserId,
        dateTime: currentDateTime,
        assets: copyResult,
        message: copyResult.success 
          ? `Портфель ${newUserId} создан с ${copyResult.copied} активами`
          : `Портфель ${newUserId} создан, но активы не скопированы`
      };

    } catch (error) {
      console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
      return {
        success: false,
        error: error.message,
        message: `Ошибка: ${error.message}`
      };
    }
  }
};