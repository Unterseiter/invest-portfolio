// Базовая структура портфеля
const initialPortfolio = {
  totalValue: 15480.75,  // Общая стоимость портфеля
  dailyChange: +324.50,  // Изменение за день
  dailyChangePercent: +2.14,  // Изменение в процентах
  currency: 'USD',
  lastUpdated: new Date().toISOString()
};

// Активы в портфеле
const portfolioAssets = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    avgPrice: 145.30,
    currentPrice: 178.72,
    value: 1787.20,
    change: +334.20,
    changePercent: +23.00
  },
  {
    id: 2,
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    quantity: 5,
    avgPrice: 210.50,
    currentPrice: 248.42,
    value: 1242.10,
    change: +189.60,
    changePercent: +18.02
  },
  {
    id: 3,
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 3,
    avgPrice: 125.80,
    currentPrice: 142.05,
    value: 426.15,
    change: +48.75,
    changePercent: +12.91
  },
  {
    id: 4,
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    quantity: 8,
    avgPrice: 305.20,
    currentPrice: 374.58,
    value: 2996.64,
    change: +554.24,
    changePercent: +22.69
  },
  {
    id: 5,
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 0.5,
    avgPrice: 42500.00,
    currentPrice: 51280.00,
    value: 25640.00,
    change: +4380.00,
    changePercent: +20.62
  }
];

// Генератор исторических данных для портфеля
const generatePortfolioHistory = (period, points = 50) => {
  const baseValue = initialPortfolio.totalValue;
  const data = [];
  const now = new Date();
  
  // Волатильность в зависимости от периода
  const volatility = {
    'hour': 0.8,
    'day': 3,
    'week': 8,
    'month': 15,
    'year': 30
  }[period];

  // Начальное значение портфеля (немного назад от текущего)
  let portfolioValue = baseValue - (Math.random() * baseValue * 0.1);

  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    
    // Вычитаем время в зависимости от периода
    switch (period) {
      case 'hour':
        date.setMinutes(now.getMinutes() - i * 1.2);
        break;
      case 'day':
        date.setHours(now.getHours() - i * 0.48);
        break;
      case 'week':
        date.setDate(now.getDate() - i);
        break;
      case 'month':
        date.setDate(now.getDate() - i * 6);
        break;
      case 'year':
        date.setMonth(now.getMonth() - i);
        break;
      default:
        date.setHours(now.getHours() - i);
    }

    // Генерируем изменение стоимости портфеля
    const change = (Math.random() - 0.5) * 2 * (volatility * portfolioValue / 100);
    portfolioValue = i === points ? portfolioValue : portfolioValue + change;
    
    // Обеспечиваем общий тренд роста
    const trend = period === 'year' ? 1.002 : 1.0005;
    portfolioValue *= trend;

    data.push({
      timestamp: date.getTime(),
      date: date.toISOString(),
      value: Math.max(1000, Number(portfolioValue.toFixed(2))), // Минимум 1000
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
  }

  // Последняя точка должна быть текущим значением портфеля
  if (data.length > 0) {
    data[data.length - 1].value = baseValue;
  }

  return data;
};

// Генератор исторических данных для отдельных активов
const generateAssetHistory = (symbol, period, points = 50) => {
  const asset = portfolioAssets.find(a => a.symbol === symbol);
  if (!asset) return [];

  const basePrice = asset.currentPrice;
  const data = [];
  const now = new Date();
  
  const volatility = {
    'hour': 0.5,
    'day': 2,
    'week': 5,
    'month': 10,
    'year': 25
  }[period];

  let price = basePrice * 0.9; // Начинаем с 90% от текущей цены

  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    
    switch (period) {
      case 'hour':
        date.setMinutes(now.getMinutes() - i * 1.2);
        break;
      case 'day':
        date.setHours(now.getHours() - i * 0.48);
        break;
      case 'week':
        date.setDate(now.getDate() - i);
        break;
      case 'month':
        date.setDate(now.getDate() - i * 6);
        break;
      case 'year':
        date.setMonth(now.getMonth() - i);
        break;
    }

    const change = (Math.random() - 0.5) * 2 * volatility;
    price = i === points ? price : price + change;
    
    const trend = period === 'year' ? 1.0018 : 1.0003;
    price *= trend;

    data.push({
      timestamp: date.getTime(),
      date: date.toISOString(),
      price: Math.max(1, Number(price.toFixed(2))),
      volume: Math.floor(Math.random() * 10000) + 1000
    });
  }

  if (data.length > 0) {
    data[data.length - 1].price = basePrice;
  }

  return data;
};

// Основные API функции
export const PortfolioAPI = {
  // Получить текущее состояние портфеля
  getPortfolioOverview: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      ...initialPortfolio,
      assets: portfolioAssets
    };
  },

  // Получить историю портфеля за период
  getPortfolioHistory: async (period = 'day') => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      period,
      data: generatePortfolioHistory(period),
      overview: initialPortfolio
    };
  },

  // Получить историю конкретного актива
  getAssetHistory: async (symbol, period = 'day') => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const asset = portfolioAssets.find(a => a.symbol === symbol);
    return {
      period,
      symbol,
      data: generateAssetHistory(symbol, period),
      assetInfo: asset
    };
  },

  // Получить список всех активов
  getAssets: async () => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return portfolioAssets;
  },

  // Получить данные для графика распределения активов
  getAssetAllocation: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const total = initialPortfolio.totalValue;
    return portfolioAssets.map(asset => ({
      name: asset.name,
      symbol: asset.symbol,
      value: asset.value,
      percentage: Number(((asset.value / total) * 100).toFixed(1)),
      quantity: asset.quantity
    }));
  },

  // Получить общую статистику
  getPortfolioStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const totalInvested = portfolioAssets.reduce((sum, asset) => 
      sum + (asset.avgPrice * asset.quantity), 0);
    const totalCurrent = portfolioAssets.reduce((sum, asset) => 
      sum + asset.value, 0);
    const totalProfit = totalCurrent - totalInvested;
    const totalProfitPercent = ((totalProfit / totalInvested) * 100);

    return {
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrent: Number(totalCurrent.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalProfitPercent: Number(totalProfitPercent.toFixed(2)),
      bestPerformer: portfolioAssets.reduce((best, current) => 
        current.changePercent > best.changePercent ? current : best
      ),
      worstPerformer: portfolioAssets.reduce((worst, current) => 
        current.changePercent < worst.changePercent ? current : worst
      )
    };
  }
};

// Предзагруженные данные для быстрого доступа
export const sampleChartData = {
  portfolio: {
    hour: generatePortfolioHistory('hour'),
    day: generatePortfolioHistory('day'),
    week: generatePortfolioHistory('week'),
    month: generatePortfolioHistory('month'),
    year: generatePortfolioHistory('year')
  },
  assets: {
    AAPL: {
      hour: generateAssetHistory('AAPL', 'hour'),
      day: generateAssetHistory('AAPL', 'day'),
      week: generateAssetHistory('AAPL', 'week'),
      month: generateAssetHistory('AAPL', 'month'),
      year: generateAssetHistory('AAPL', 'year')
    },
    TSLA: {
      hour: generateAssetHistory('TSLA', 'hour'),
      day: generateAssetHistory('TSLA', 'day'),
      week: generateAssetHistory('TSLA', 'week'),
      month: generateAssetHistory('TSLA', 'month'),
      year: generateAssetHistory('TSLA', 'year')
    }
    // ... можно добавить другие активы
  }
};

// Экспорт констант для прямого доступа
export { initialPortfolio, portfolioAssets };

export default PortfolioAPI;