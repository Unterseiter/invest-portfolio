// frontend/src/services/portfolioAPI.js

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
  // Получить все записи портфеля (сортировка по дате)
  getPortfolios: async () => {
    const result = await fetchAPI('/api/portfolio');
    return result.data || [];
  },

  // Получить портфель по user_id
  getPortfolioByUserId: async (userId) => {
    const result = await fetchAPI(`/api/portfolio/${userId}`);
    return result.data;
  },

  // Получить портфель по дате
  getPortfolioByDate: async (date) => {
    const result = await fetchAPI(`/api/portfolio/${date}`);
    return result.data;
  },

  // Создать новый портфель
  createPortfolio: async (date) => {
    const result = await fetchAPI('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    return result;
  },

  // Table_securities API
  getTableSecurities: async (userId) => {
    const result = await fetchAPI(`/api/table_securities/all/${userId}`);
    return result.data || [];
  },

  getTableSecurityById: async (id) => {
    const result = await fetchAPI(`/api/table_securities/${id}`);
    return result.data;
  },

  addTableSecurity: async (securitie_id, quantity) => {
    const result = await fetchAPI('/api/table_securities/all', {
      method: 'POST',
      body: JSON.stringify({ securitie_id, quantity }),
    });
    return result;
  },

  // Stock_names API
  getStockNames: async () => {
    const result = await fetchAPI('/api/stock_name');
    return result.data || [];
  },

  getStockNameById: async (name_id) => {
    const result = await fetchAPI(`/api/stock_name/${name_id}`);
    return result.data;
  },

  // Table_stocks API
  getTableStocks: async (name_id) => {
    const result = await fetchAPI(`/api/table_stock/${name_id}`);
    return result.data || [];
  },

  // РЕАЛЬНЫЙ метод для истории портфеля
  getPortfolioHistory: async (period) => {
    try {
      console.log('Fetching REAL portfolio history for period:', period);
      
      // Получаем все портфели из бэкенда
      const portfolios = await PortfolioAPI.getPortfolios();
      
      if (!portfolios || portfolios.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No portfolio data available'
        };
      }

      // Преобразуем данные портфелей в формат для графика
      const chartData = portfolios.map(portfolio => ({
        timestamp: new Date(portfolio.date).getTime(),
        value: portfolio.total_value || 0
      }));

      // Фильтруем данные по выбранному периоду
      const filteredData = filterDataByPeriod(chartData, period);
      
      // Сортируем по времени (от старых к новым)
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
  }
};

// Функция для фильтрации данных по периоду (РЕАЛЬНЫЕ ДАННЫЕ)
const filterDataByPeriod = (data, period) => {
  if (!data || data.length === 0) return [];
  
  const now = new Date();
  let startTime;

  switch (period) {
    case 'hour':
      startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 час назад
      break;
    case 'day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 день назад
      break;
    case 'week':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 неделя назад
      break;
    case 'month':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
      break;
    case 'year':
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 год назад
      break;
    default:
      return data;
  }

  // Фильтруем данные, оставляя только те, что после startTime
  const filtered = data.filter(item => new Date(item.timestamp) >= startTime);
  
  // Если данных мало, возвращаем все доступные
  return filtered.length > 1 ? filtered : data;
};