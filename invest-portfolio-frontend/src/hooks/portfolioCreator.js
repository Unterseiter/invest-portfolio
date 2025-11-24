// utils/portfolioCreator.js
import { PortfolioAPI } from '../services/portfolioAPI';

export const portfolioCreator = {
  // Основная функция создания портфеля с активами
  createPortfolioWithAssets: async () => {
    try {
      console.log('🚀 Начало создания портфеля с активами');
      
      // 1. Создаем портфель
      const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const createResult = await PortfolioAPI.createPortfolio(currentDateTime);
      
      if (!createResult.success) {
        throw new Error(createResult.message || 'Ошибка при создании портфеля');
      }

      // 2. Находим новый портфель
      const portfolios = await PortfolioAPI.getPortfolios();
      const newPortfolio = portfolios.reduce((max, portfolio) => 
        portfolio.id > max.id ? portfolio : max
      );
      
      if (!newPortfolio) {
        throw new Error('Не удалось найти созданный портфель');
      }

      const newUserId = newPortfolio.id;
      console.log(`🆔 Создан портфель ID: ${newUserId}`);

      // 3. Копируем активы из предыдущего портфеля
      const copySuccess = await portfolioCreator.copyAssetsToPortfolio(newUserId);
      
      return {
        success: true,
        portfolioId: newUserId,
        dateTime: currentDateTime,
        assetsCopied: copySuccess
      };

    } catch (error) {
      console.error('❌ Ошибка создания портфеля:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Функция копирования активов в указанный портфель
  copyAssetsToPortfolio: async (targetUserId, sourceUserId = null) => {
    try {
      // Если sourceUserId не указан, берем предыдущий портфель
      const previousUserId = sourceUserId || (targetUserId - 1);
      
      if (previousUserId < 1) {
        console.log('⭐ Это первый портфель, нечего копировать');
        return true;
      }

      // Получаем активы предыдущего портфеля
      let previousAssets;
      try {
        previousAssets = await PortfolioAPI.getTableSecurities(previousUserId);
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('📭 Нет активов для копирования');
          return true;
        }
        throw error;
      }

      if (!previousAssets || previousAssets.length === 0) {
        console.log('📭 Нет активов для копирования');
        return true;
      }

      console.log(`📋 Копируем ${previousAssets.length} активов в портфель ${targetUserId}`);

      // Получаем все stock_names для маппинга тикеров
      const stockNames = await PortfolioAPI.getStockNames();
      
      let successCount = 0;
      for (const asset of previousAssets) {
        try {
          // Находим securitie_id по тикеру
          const stock = stockNames.find(s => s.name === asset.ticker);
          if (!stock) {
            console.log(`⚠️ Пропускаем ${asset.ticker} - не найден в stock_names`);
            continue;
          }

          await PortfolioAPI.addTableSecurity(targetUserId, stock.id, asset.quantity);
          console.log(`✅ Скопирован: ${asset.ticker} -> quantity: ${asset.quantity}`);
          successCount++;
        } catch (assetError) {
          console.error(`❌ Ошибка копирования ${asset.ticker}:`, assetError);
        }
      }

      console.log(`🎉 Успешно скопировано ${successCount} активов`);
      return successCount > 0;

    } catch (error) {
      console.error('💥 Ошибка копирования активов:', error);
      return false;
    }
  }
};