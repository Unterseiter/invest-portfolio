// mockData.js - Моковые данные для портфеля инвестора

// Базовые данные портфеля
const initialPortfolio = {
  totalValue: 0, // Будет рассчитано автоматически
  dailyChange: 0, // Будет рассчитано автоматически
  dailyChangePercent: 0, // Будет рассчитано автоматически
  currency: 'RUB',
  lastUpdated: new Date().toISOString()
};

// Генерация случайной цены в диапазоне 2000-7000 рублей
const generateRandomPrice = () => {
  return Number((Math.random() * (7000 - 2000) + 2000).toFixed(2));
};

// Генерация случайного изменения цены в процентах (-10% до +10%)
const generateRandomChangePercent = () => {
  return Number((Math.random() * 20 - 10).toFixed(2));
};

// Активы в портфеле (6 различных активов)
const portfolioAssets = [
  {
    id: 1,
    symbol: 'GAZP',
    name: 'Газпром',
    quantity: 100,
    avgPrice: 4500.00,
    currentPrice: generateRandomPrice(),
    changePercent: generateRandomChangePercent()
  },
  {
    id: 2,
    symbol: 'SBER',
    name: 'Сбербанк',
    quantity: 50,
    avgPrice: 3200.00,
    currentPrice: generateRandomPrice(),
    changePercent: generateRandomChangePercent()
  },
  {
    id: 3,
    symbol: 'LKOH',
    name: 'Лукойл',
    quantity: 30,
    avgPrice: 6800.00,
    currentPrice: generateRandomPrice(),
    changePercent: generateRandomChangePercent()
  },
  {
    id: 4,
    symbol: 'YNDX',
    name: 'Яндекс',
    quantity: 20,
    avgPrice: 4200.00,
    currentPrice: generateRandomPrice(),
    changePercent: generateRandomChangePercent()
  },
  {
    id: 5,
    symbol: 'VTBR',
    name: 'ВТБ',
    quantity: 200,
    avgPrice: 2500.00,
    currentPrice: generateRandomPrice(),
    changePercent: generateRandomChangePercent()
  },
  {
    id: 6,
    symbol: 'POLY',
    name: 'Polymetal',
    quantity: 40,
    avgPrice: 3800.00,
    currentPrice: generateRandomPrice(),
    changePercent: generateRandomChangePercent()
  }
];

// Рассчитываем производные поля для активов
portfolioAssets.forEach(asset => {
  asset.value = Number((asset.quantity * asset.currentPrice).toFixed(2));
  asset.change = Number(((asset.changePercent / 100) * (asset.quantity * asset.avgPrice)).toFixed(2));
});

// Обновляем данные портфеля на основе активов
const updatePortfolioData = () => {
  const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalInvested = portfolioAssets.reduce((sum, asset) => sum + (asset.avgPrice * asset.quantity), 0);
  const dailyChange = totalValue - totalInvested;
  const dailyChangePercent = ((dailyChange / totalInvested) * 100);
  
  initialPortfolio.totalValue = Number(totalValue.toFixed(2));
  initialPortfolio.dailyChange = Number(dailyChange.toFixed(2));
  initialPortfolio.dailyChangePercent = Number(dailyChangePercent.toFixed(2));
};

updatePortfolioData();

// Данные для секторного распределения (пирог)
export const sectorAllocationData = [
  {
    sector: 'Нефть и Газ',
    value: portfolioAssets.filter(a => ['GAZP', 'LKOH'].includes(a.symbol))
                         .reduce((sum, asset) => sum + asset.value, 0),
    percentage: 0, // Будет рассчитано ниже
    color: '#FF6B6B',
    assets: ['GAZP', 'LKOH']
  },
  {
    sector: 'Финансы',
    value: portfolioAssets.filter(a => ['SBER', 'VTBR'].includes(a.symbol))
                         .reduce((sum, asset) => sum + asset.value, 0),
    percentage: 0,
    color: '#4ECDC4',
    assets: ['SBER', 'VTBR']
  },
  {
    sector: 'Технологии',
    value: portfolioAssets.filter(a => ['YNDX'].includes(a.symbol))
                         .reduce((sum, asset) => sum + asset.value, 0),
    percentage: 0,
    color: '#45B7D1',
    assets: ['YNDX']
  },
  {
    sector: 'Металлы',
    value: portfolioAssets.filter(a => ['POLY'].includes(a.symbol))
                         .reduce((sum, asset) => sum + asset.value, 0),
    percentage: 0,
    color: '#FFA07A',
    assets: ['POLY']
  }
];

// Рассчитываем проценты для секторов
const totalSectorValue = sectorAllocationData.reduce((sum, sector) => sum + sector.value, 0);
sectorAllocationData.forEach(sector => {
  sector.percentage = Number(((sector.value / totalSectorValue) * 100).toFixed(1));
  sector.value = Number(sector.value.toFixed(2));
});

// Функция для получения данных секторного распределения
export const getSectorAllocation = (assets) => {
  return sectorAllocationData;
};

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
      value: Math.max(1000, Number(portfolioValue.toFixed(2))),
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

  // Получить секторное распределение
  getSectorAllocation: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return sectorAllocationData;
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
    GAZP: {
      hour: generateAssetHistory('GAZP', 'hour'),
      day: generateAssetHistory('GAZP', 'day'),
      week: generateAssetHistory('GAZP', 'week'),
      month: generateAssetHistory('GAZP', 'month'),
      year: generateAssetHistory('GAZP', 'year')
    },
    SBER: {
      hour: generateAssetHistory('SBER', 'hour'),
      day: generateAssetHistory('SBER', 'day'),
      week: generateAssetHistory('SBER', 'week'),
      month: generateAssetHistory('SBER', 'month'),
      year: generateAssetHistory('SBER', 'year')
    }
    // ... можно добавить другие активы по аналогии
  }
};

// Экспорт констант для прямого доступа
export { initialPortfolio, portfolioAssets };

export default PortfolioAPI;