const API_BASE_URL = 'http://localhost:5000';

const fetchAPI = async (endpoint, options = {}) => {
  try {
    console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
    
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

  updatePortfolio: async (date) => {
    const result = await fetchAPI('/api/portfolio', {
      method: 'PUT',
      body: JSON.stringify({ date }),
    });
    return result;
  },

  deletePortfolio: async (userId) => {
    const result = await fetchAPI(`/api/portfolio/${userId}`, {
      method: 'DELETE',
    });
    return result;
  },

  // ========== TABLE_SECURITIES METHODS ==========
  getTableSecurities: async (userId) => {
    const result = await fetchAPI(`/api/table_securities/all/${userId}`);
    return result.data || [];
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
    // ВАЖНО: В роуте ошибка - используется method GET вместо DELETE
    // Временно используем GET, но нужно поправить бэкенд
    const result = await fetchAPI(`/api/table_securities/${id}`, {
      method: 'GET', // Должно быть DELETE, но в роуте ошибка
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

  // ========== CUSTOM METHODS ==========
  getPortfolioHistory: async (period) => {
    try {
      console.log('Fetching REAL portfolio history for period:', period);
      
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

      console.log(`Loaded ${filteredData.length} real data points for ${period} period`);
      
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
  // Получить полную информацию об активе (акция + котировки)
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

  // Получить текущую цену актива
  getCurrentPrice: async (securitie_id) => {
    try {
      const stockData = await PortfolioAPI.getStockNameById(securitie_id);
      if (stockData && stockData.table && stockData.table.length > 0) {
        // Последняя запись в таблице - самая свежая цена
        const latestPrice = stockData.table[stockData.table.length - 1];
        return latestPrice.close;
      }
      return null;
    } catch (error) {
      console.error('Error getting current price:', error);
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