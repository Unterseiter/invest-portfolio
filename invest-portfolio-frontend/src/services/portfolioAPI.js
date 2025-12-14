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

// Вспомогательные функции
const extractNumber = (str) => {
  if (!str) return 0;
  const match = str.match(/[\d.-]+/);
  return match ? parseFloat(match[0]) : 0;
};

const getVolatilityLevel = (value) => {
  const v = parseFloat(value) || 0;
  if (v < 0.8) return 'Низкая';
  if (v < 2) return 'Средняя';
  return 'Высокая';
};

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

  deleteSecurityBySecuritieId: async (userId, securitieId) => {
    try {
      const securities = await PortfolioAPI.getTableSecurities(userId);
      
      const securityToDelete = securities.find(s => 
        s.securitie_id === securitieId || 
        s.securitie_id === parseInt(securitieId)
      );
      
      if (!securityToDelete) {
        throw new Error('Запись не найдена');
      }
      
      if (securityToDelete.id) {
        return await PortfolioAPI.deleteTableSecurity(securityToDelete.id);
      }
      
      return await PortfolioAPI.deleteTableSecurity(securityToDelete.securitie_id);
      
    } catch (error) {
      console.error('Error in deleteSecurityBySecuritieId:', error);
      throw error;
    }
  },

  // ========== TABLE_SECURITIES METHODS ==========
  getTableSecurities: async (userId) => {
    const result = await fetchAPI(`/api/table_securities/all/${userId}`);
    const securities = result.data || [];
    console.log('Структура данных table_securities:', securities);
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
  getExtendedMLPrediction: async (ticker_id, hours = 12) => {
    try {
      const result = await fetchAPI('/api/ml_predict', {
        method: 'POST',
        body: JSON.stringify({ ticker_id, hours }),
      });
      
      const data = result.data;
      
      if (!data) return null;
      
      // Просто возвращаем данные как есть
      return {
        table_predictions: data.table_predictions || [],
        market_signal: data.market_signal || '',
        assurance: data.assurance || 0,
        balance: data.balance || '',
        volatility: data.volatility || '',
        recommendation_signal: data.recommendation_signal || '',
        hours: data.hours || hours,
        generated_at: data.generated_at || new Date().toISOString(),
        
        // Извлекаем числовые значения для удобства
        signal_score: extractNumber(data.market_signal),
        balance_score: extractNumber(data.balance),
        volatility_score: extractNumber(data.volatility),
        recommendation_score: extractNumber(data.recommendation_signal)
      };
    } catch (error) {
      console.error('Error getting extended ML prediction:', error);
      return null;
    }
  },

  getMLPrediction: async (ticker_id, hours = 24) => {
    try {
      const result = await fetchAPI('/api/ml_predict', {
        method: 'POST',
        body: JSON.stringify({ ticker_id, hours }),
      });
      return result.data;
    } catch (error) {
      console.error('Error with POST method, trying GET:', error);
      
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
      // Получаем сырые данные от ML API
      const mlData = await PortfolioAPI.getExtendedMLPrediction(ticker_id, hours);
      
      if (!mlData) {
        throw new Error('No forecast data received from server');
      }

      const predictions = mlData.table_predictions || [];
      
      // Берем данные как есть с бекенда
      const market_signal = mlData.market_signal || '';
      const balance_data = mlData.balance || '';
      const volatility_data = mlData.volatility || '';
      const recommendation_data = mlData.recommendation_signal || '';
      const assurance = mlData.assurance || 0;
      
      // Расчет статистики свечей
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
      
      // Расчет общего изменения
      let overallChange = 0;
      if (predictions.length >= 2) {
        const first = predictions[0]?.close || 0;
        const last = predictions[predictions.length - 1]?.close || 0;
        if (first > 0) {
          overallChange = ((last - first) / first * 100).toFixed(2);
        }
      }
      
      // Генерация свечей для прогноза
      const forecastCandles = predictions.map((pred, index) => ({
        timestamp: new Date(pred.date || Date.now() + (index + 1) * 60 * 60 * 1000).getTime(),
        date: pred.date || new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toISOString(),
        open: pred.open || 0,
        high: pred.high || 0,
        low: pred.low || 0,
        close: pred.close || 0,
        isForecast: true,
        volume: pred.volume || 0
      }));
      
      return {
        analysis: {
          marketSignal: market_signal, // Просто передаем как есть
          modelConfidence: {
            model1: mlData.assurance ? Math.round(mlData.assurance * 100) : 0,
            model2: mlData.assurance ? 100 - Math.round(mlData.assurance * 100) : 0,
            average: mlData.assurance ? Math.round(mlData.assurance * 100) : 0
          },
          balance: balance_data, // Просто передаем как есть
          balanceDetails: {
            score: mlData.balance_score ? Math.round(mlData.balance_score * 100) : 0,
            description: balance_data
          },
          volatility: {
            value: mlData.volatility_score || 0,
            level: getVolatilityLevel(mlData.volatility_score || 0)
          },
          recommendation: recommendation_data, // Просто передаем как есть
          overallChangePercent: overallChange,
          recommendationDetails: {
            confidence: mlData.recommendation_score ? Math.round(mlData.recommendation_score * 100) : 0,
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
        generatedAt: mlData.generated_at || new Date().toISOString(),
        forecastCandles: forecastCandles,
        rawData: mlData
      };
      
    } catch (error) {
      console.error('Error in getMLForecast:', error);
      throw error;
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
  },

  // ========== НОВЫЕ МЕТОДЫ ДЛЯ BEST/WORST PERFORMER ==========
  getTickerIdByName: async (tickerName) => {
    try {
      const stockNames = await PortfolioAPI.getStockNames();
      const ticker = stockNames.find(s => s.name === tickerName);
      return ticker ? ticker.id : null;
    } catch (error) {
      console.error('Error getting ticker id by name:', error);
      return null;
    }
  },

  getTickerInfoByName: async (tickerName) => {
    try {
      const stockNames = await PortfolioAPI.getStockNames();
      const ticker = stockNames.find(s => s.name === tickerName);
      if (!ticker) return null;
      
      const stockData = await PortfolioAPI.getStockNameById(ticker.id);
      return {
        id: ticker.id,
        name: ticker.name,
        full_name: ticker.full_name,
        stockData: stockData
      };
    } catch (error) {
      console.error('Error getting ticker info by name:', error);
      return null;
    }
  },

  calculatePriceChange: async (tickerId) => {
    try {
      const stockData = await PortfolioAPI.getStockNameById(tickerId);
      if (!stockData?.table || stockData.table.length < 2) return 0;
      
      const prices = stockData.table;
      const currentPrice = prices[prices.length - 1].close;
      const previousPrice = prices[prices.length - 2].close;
      
      return ((currentPrice - previousPrice) / previousPrice) * 100;
    } catch (error) {
      console.error('Error calculating price change:', error);
      return 0;
    }
  },

  getAssetFullInfoByTicker: async (tickerName) => {
    try {
      const tickerInfo = await PortfolioAPI.getTickerInfoByName(tickerName);
      if (!tickerInfo) return null;
      
      const priceChange = await PortfolioAPI.calculatePriceChange(tickerInfo.id);
      const currentPrice = tickerInfo.stockData?.table?.[tickerInfo.stockData.table.length - 1]?.close || 0;
      
      return {
        symbol: tickerInfo.name,
        name: tickerInfo.full_name,
        tickerId: tickerInfo.id,
        priceChange: priceChange,
        currentPrice: currentPrice,
        stockData: tickerInfo.stockData
      };
    } catch (error) {
      console.error('Error getting asset full info by ticker:', error);
      return null;
    }
  }
};