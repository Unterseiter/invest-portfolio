const API_BASE_URL = 'http://localhost:5000';

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Request failed');
    }

    return result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const PortfolioAPI = {
  // ========== PORTFOLIO METHODS ==========
  getPortfolios: async () => {
    const result = await fetchAPI('/api/portfolio');
    return result.data || [];
  },

  getPortfolioByUserId: async (userId) => {
    const result = await fetchAPI(`/api/portfolio/${userId}`);
    return result.data;
  },

  getPortfolioByDate: async (date) => {
    const result = await fetchAPI(`/api/portfolio/${date}`);
    return result.data;
  },

  createPortfolio: async (date) => {
    const result = await fetchAPI('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    return result;
  },

  updatePortfolio: async (prevDate, newDate) => {
    const result = await fetchAPI('/api/portfolio', {
      method: 'PUT',
      body: JSON.stringify({ date: prevDate, new_date: newDate }),
    });
    return result;
  },

  deletePortfolio: async (userId) => {
    const result = await fetchAPI(`/api/portfolio/${userId}`, {
      method: 'DELETE',
    });
    return result;
  },

// В portfolioAPI.js, добавьте этот метод:
deleteSecurityBySecuritieId: async (userId, securitieId) => {
  try {
    // Сначала получаем все записи пользователя
    const securities = await PortfolioAPI.getTableSecurities(userId);
    
    // Находим запись с нужным securitie_id
    const securityToDelete = securities.find(s => 
      s.securitie_id === securitieId || 
      s.securitie_id === parseInt(securitieId)
    );
    
    if (!securityToDelete) {
      throw new Error('Запись не найдена');
    }
    
    // Если у записи есть id, удаляем по нему
    if (securityToDelete.id) {
      return await PortfolioAPI.deleteTableSecurity(securityToDelete.id);
    }
    
    // Если нет id, пробуем удалить по securitie_id
    // (если бэкенд поддерживает такой вариант)
    return await PortfolioAPI.deleteTableSecurity(securityToDelete.securitie_id);
    
  } catch (error) {
    console.error('Error in deleteSecurityBySecuritieId:', error);
    throw error;
  }
},

  // ========== TABLE_SECURITIES METHODS ==========
getTableSecurities: async (userId) => {
  const result = await fetchAPI(`/api/table_securities/all/${userId}`);
  
  // ВАЖНО: Убедитесь, что в ответе есть id записи
  const securities = result.data || [];
  
  // Добавляем логирование, чтобы увидеть структуру данных
  console.log('Структура данных table_securities:', securities);
  
  // Возвращаем данные как есть, предполагая что id уже есть
  return securities;
},

  getTableSecurityById: async (id) => {
    const result = await fetchAPI(`/api/table_securities/${id}`);
    return result.data;
  },

  addTableSecurity: async (userId, securitie_id, quantity) => {
    const result = await fetchAPI(`/api/table_securities/all/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ securitie_id, quantity }),
    });
    return result;
  },

  updateTableSecurity: async (id, securitie_id, quantity) => {
    const result = await fetchAPI(`/api/table_securities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ securitie_id, quantity }),
    });
    return result;
  },

  deleteTableSecurity: async (id) => {
  const result = await fetchAPI(`/api/table_securities/${id}`, {
    method: 'DELETE',
  });
  return result;
},

  // ========== STOCK_NAMES METHODS ==========
  getStockNames: async () => {
    const result = await fetchAPI('/api/stock_name');
    return result.data || [];
  },

  getStockNameById: async (name_id) => {
    const result = await fetchAPI(`/api/stock_name/${name_id}`);
    return result.data;
  },

  deleteStockName: async (name_id) => {
    const result = await fetchAPI(`/api/stock_name/${name_id}`, {
      method: 'DELETE',
    });
    return result;
  },

  // ========== TABLE_STOCKS METHODS ==========
  getTableStocks: async (name_id) => {
    const result = await fetchAPI(`/api/table_stock/${name_id}`);
    return result.data || [];
  },

  getTableStockById: async (name_id, record_id) => {
    const result = await fetchAPI(`/api/table_stock/${name_id}/${record_id}`);
    return result.data;
  },

  createTableStock: async (name, full_name, begin_date, end_date) => {
    const result = await fetchAPI('/api/table_stock', {
      method: 'POST',
      body: JSON.stringify({ name, full_name, begin_date, end_date }),
    });
    return result;
  },

  updateTableStock: async (name) => {
    const result = await fetchAPI('/api/table_stock', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return result;
  },

  deleteTableStock: async (name_id) => {
    const result = await fetchAPI(`/api/table_stock/${name_id}`, {
      method: 'DELETE',
    });
    return result;
  },

  // ========== ML PREDICTION METHODS ==========
  getMLPrediction: async (ticker_id, hours = 24) => {
    try {
      // Пробуем POST метод (как должно быть)
      const result = await fetchAPI('/api/ml_predict', {
        method: 'POST',
        body: JSON.stringify({ ticker_id, hours }),
      });
      return result.data;
    } catch (error) {
      console.error('Error with POST method, trying GET:', error);
      
      // Если POST не работает, пробуем GET с параметрами
      try {
        const result = await fetchAPI(`/api/ml_predict?ticker_id=${ticker_id}&hours=${hours}`);
        return result.data;
      } catch (getError) {
        console.error('Both POST and GET methods failed:', getError);
        throw new Error('ML prediction API is not available');
      }
    }
  },

  getMLForecast: async (ticker_id, hours = 24) => {
    try {
      // Получаем данные от ML API
      const mlData = await PortfolioAPI.getMLPrediction(ticker_id, hours);
      
      if (!mlData) {
        throw new Error('No forecast data received from server');
      }

      // Трансформируем данные для UI
      const predictions = mlData.table_predictions || [];
      const market_signal = mlData.market_signal || 'hold';
      const assurance = mlData.assurance || 0.5;
      const balance = mlData.balance || 'hold';
      const volatility = mlData.volatility || '3.5';
      const recommendation_signal = mlData.recommendation_signal || 'hold';
      
      // Рассчитываем статистику
      let bullish = 0, bearish = 0, maxGain = 0, maxLoss = 0;
      
      predictions.forEach(pred => {
        const change = pred.close - pred.open;
        if (change > 0) {
          bullish++;
          const gain = ((change / pred.open) * 100);
          if (gain > maxGain) maxGain = gain;
        } else if (change < 0) {
          bearish++;
          const loss = ((change / pred.open) * 100);
          if (loss < maxLoss) maxLoss = loss;
        }
      });
      
      // Рассчитываем общее изменение
      let overallChange = 0;
      if (predictions.length >= 2) {
        const first = predictions[0]?.close || 0;
        const last = predictions[predictions.length - 1]?.close || 0;
        if (first > 0) {
          overallChange = ((last - first) / first * 100).toFixed(2);
        }
      }
      
      // Функции для форматирования
      const getVolatilityLevel = (vol) => {
        const v = parseFloat(vol) || 0;
        if (v < 2) return 'Низкая';
        if (v < 5) return 'Средняя';
        return 'Высокая';
      };
      
      const translateSignal = (signal) => {
        const map = { 'buy': 'Рост', 'sell': 'Падение', 'hold': 'Боковик' };
        return map[signal?.toLowerCase()] || 'Боковик';
      };
      
      const translateRecommendation = (rec) => {
        const map = { 'buy': 'Покупать', 'sell': 'Продавать', 'hold': 'Держать позицию' };
        return map[rec?.toLowerCase()] || 'Держать позицию';
      };
      
      // Форматируем прогнозные свечи
      const forecastCandles = predictions.map((pred, index) => ({
        timestamp: new Date(Date.now() + (index + 1) * 60 * 60 * 1000).getTime(),
        date: pred.date || new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toISOString(),
        open: pred.open || 0,
        high: pred.high || 0,
        low: pred.low || 0,
        close: pred.close || 0,
        isForecast: true,
        volume: pred.volume || 0
      }));
      
      // Возвращаем структуру для UI
      return {
        analysis: {
          marketSignal: translateSignal(market_signal),
          modelConfidence: {
            model1: Math.round(assurance * 100),
            model2: 100 - Math.round(assurance * 100),
            average: Math.round(assurance * 100)
          },
          modelAgreement: market_signal === balance ? 'Согласованы' : 'Расходятся',
          volatility: {
            value: parseFloat(volatility) || 3.5,
            level: getVolatilityLevel(volatility)
          },
          recommendation: translateRecommendation(recommendation_signal),
          overallChangePercent: overallChange,
          recommendationDetails: {
            confidence: Math.round(assurance * 100),
            timeframe: `${hours} часов`
          }
        },
        statistics: {
          bullishCandles: bullish,
          bearishCandles: bearish,
          neutralCandles: predictions.length - bullish - bearish,
          maxGain: maxGain.toFixed(2),
          maxLoss: Math.abs(maxLoss).toFixed(2)
        },
        forecastHours: hours,
        generatedAt: new Date().toISOString(),
        forecastCandles: forecastCandles
      };
      
    } catch (error) {
      console.error('Error in getMLForecast:', error);
      throw error; // Просто пробрасываем ошибку дальше
    }
  },

  // ========== CUSTOM METHODS ==========
  getPortfolioHistory: async (period) => {
    try {
      const portfolios = await PortfolioAPI.getPortfolios();
      
      if (!portfolios || portfolios.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No portfolio data available'
        };
      }

      const chartData = portfolios.map(portfolio => ({
        timestamp: new Date(portfolio.date).getTime(),
        value: portfolio.total_value || 0
      }));

      const filteredData = filterDataByPeriod(chartData, period);
      filteredData.sort((a, b) => a.timestamp - b.timestamp);

      return {
        success: true,
        data: filteredData
      };
    } catch (error) {
      console.error('Error loading real portfolio history:', error);
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  },

  // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========
  getAssetWithPrices: async (asset) => {
    try {
      if (!asset || !asset.securitie_id) {
        throw new Error('Invalid asset data');
      }

      const stockData = await PortfolioAPI.getStockNameById(asset.securitie_id);
      return {
        ...asset,
        stockData
      };
    } catch (error) {
      console.error('Error loading asset with prices:', error);
      throw error;
    }
  },

  getCurrentPrice: async (securitie_id) => {
    try {
      const stockData = await PortfolioAPI.getStockNameById(securitie_id);
      if (stockData && stockData.table && stockData.table.length > 0) {
        const latestPrice = stockData.table[stockData.table.length - 1];
        return latestPrice.close;
      }
      return null;
    } catch (error) {
      console.error('Error getting current price:', error);
      throw error;
    }
  },

  getAssetChangePercentage: async (userId, ticker, currentPrice) => {
    try {
      const portfolio = await PortfolioAPI.getPortfolioByUserId(userId);
      if (!portfolio || !portfolio.table) return 0;
      
      const asset = portfolio.table.find(item => item.ticker === ticker);
      if (!asset || !asset.price) return 0;
      
      return ((currentPrice - asset.price) / asset.price) * 100;
    } catch (error) {
      console.error('Error calculating asset change percentage:', error);
      return 0;
    }
  },

  removeAssetFromPortfolio: async (userId, ticker) => {
    try {
      const securities = await PortfolioAPI.getTableSecurities(userId);
      
      const asset = securities.find(sec => sec.ticker === ticker);
      if (!asset) {
        throw new Error('Asset not found in portfolio');
      }
      
      const securityDetails = await PortfolioAPI.getTableSecurityById(asset.id);
      if (!securityDetails) {
        throw new Error('Asset details not found');
      }
      
      const result = await PortfolioAPI.deleteTableSecurity(securityDetails.id);
      
      await PortfolioAPI.updatePortfolioTotalValue(userId);
      
      return result;
    } catch (error) {
      console.error('Error removing asset from portfolio:', error);
      throw error;
    }
  },

  updatePortfolioTotalValue: async (userId) => {
    try {
      const securities = await PortfolioAPI.getTableSecurities(userId);
      let totalValue = 0;
      
      for (const security of securities) {
        const stockNames = await PortfolioAPI.getStockNames();
        const stock = stockNames.find(s => s.name === security.ticker);
        
        if (stock) {
          const stockData = await PortfolioAPI.getStockNameById(stock.id);
          if (stockData && stockData.table && stockData.table.length > 0) {
            const currentPrice = stockData.table[stockData.table.length - 1].close;
            totalValue += currentPrice * security.quantity;
          }
        }
      }
      
      return totalValue;
    } catch (error) {
      console.error('Error updating portfolio value:', error);
      throw error;
    }
  },

  getAssetFullInfo: async (ticker_id) => {
    try {
      const stockData = await PortfolioAPI.getStockNameById(ticker_id);

      if (!stockData || !stockData.table || stockData.table.length === 0) {
        return null;
      }

      const prices = stockData.table;
      const currentPrice = prices[prices.length - 1].close;
      const previousPrice = prices[prices.length - 2]?.close || currentPrice;
      const changePercentage = ((currentPrice - previousPrice) / previousPrice) * 100;

      return {
        ...stockData,
        statistics: {
          currentPrice,
          changePercentage: Number(changePercentage.toFixed(2)),
          isPositive: changePercentage > 0,
          high52Week: Math.max(...prices.map(p => p.high || p.close)),
          low52Week: Math.min(...prices.map(p => p.low || p.close)),
          avgVolume: Math.round(prices.reduce((sum, p) => sum + (p.volume || 0), 0) / prices.length),
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting full asset info:', error);
      throw error;
    }
  }
};

// Функция для фильтрации данных по периоду
const filterDataByPeriod = (data, period) => {
  if (!data || data.length === 0) return [];
  
  const now = new Date();
  let startTime;

  switch (period) {
    case 'hour':
      startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      break;
    case 'day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }

  const filtered = data.filter(item => new Date(item.timestamp) >= startTime);
  return filtered.length > 1 ? filtered : data;
};