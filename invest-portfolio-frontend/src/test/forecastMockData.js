// forecastMockData.js
// Мок-данные для прогнозирования

// Функция для генерации случайного прогноза
const generateForecast = (asset, hours, historicalData) => {
  if (!asset || hours < 1 || hours > 24) {
    return null;
  }

  // Определяем базовые характеристики актива на основе исторических данных
  const lastPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 100;
  const volatility = historicalData.length > 0 ? 
    Math.abs(historicalData[historicalData.length - 1].close - historicalData[historicalData.length - 2].close) / historicalData[historicalData.length - 2].close : 0.02;
  
  // Генерация прогнозных свечей
  const forecastCandles = [];
  let currentPrice = lastPrice;
  
  for (let i = 1; i <= hours; i++) {
    // Случайное движение с тенденцией
    const trendDirection = Math.random() > 0.6 ? 1 : -1; // 60% шанс роста
    const change = currentPrice * volatility * (Math.random() * 0.5 + 0.5) * trendDirection;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (currentPrice * volatility * Math.random());
    const low = Math.min(open, close) - (currentPrice * volatility * Math.random());
    
    const candle = {
      timestamp: Date.now() + (i * 60 * 60 * 1000), // Каждый следующий час
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      isForecast: true // Флаг, что это прогнозная свеча
    };
    
    forecastCandles.push(candle);
    currentPrice = close;
  }
  
  // Анализируем прогноз для определения общего сигнала
  const firstPrice = forecastCandles[0].open;
  const lastForecastPrice = forecastCandles[forecastCandles.length - 1].close;
  const overallChange = ((lastForecastPrice - firstPrice) / firstPrice) * 100;
  
  // Определяем общий сигнал
  let marketSignal;
  if (Math.abs(overallChange) < 1) {
    marketSignal = 'Боковик';
  } else if (overallChange > 0) {
    marketSignal = 'Рост';
  } else {
    marketSignal = 'Падение';
  }
  
  // Генерируем уверенность моделей (от 0.5 до 0.95)
  const model1Confidence = 0.5 + Math.random() * 0.45;
  const model2Confidence = 0.5 + Math.random() * 0.45;
  
  // Согласованность моделей
  const agreement = Math.abs(model1Confidence - model2Confidence) < 0.2 ? 'Согласованы' : 'Не согласованы';
  
  // Волатильность прогноза (среднее изменение по свечам)
  const avgVolatility = forecastCandles.reduce((sum, candle) => {
    const candleVolatility = (candle.high - candle.low) / candle.open;
    return sum + candleVolatility;
  }, 0) / forecastCandles.length * 100;
  
  // Рекомендация к действию на основе прогноза
  let recommendation;
  if (marketSignal === 'Рост' && model1Confidence > 0.7 && model2Confidence > 0.7) {
    recommendation = 'Покупать';
  } else if (marketSignal === 'Падение' && model1Confidence > 0.7 && model2Confidence > 0.7) {
    recommendation = 'Продавать';
  } else if (marketSignal === 'Боковик' || agreement === 'Не согласованы') {
    recommendation = 'Держать позицию';
  } else {
    recommendation = 'Ожидать уточнения сигнала';
  }
  
  return {
    // Основная информация
    asset: asset.symbol,
    forecastHours: hours,
    generatedAt: new Date().toISOString(),
    
    // Прогнозные данные для графика
    forecastCandles: forecastCandles,
    
    // Аналитика прогноза
    analysis: {
      marketSignal: marketSignal,
      overallChangePercent: Number(overallChange.toFixed(2)),
      
      modelConfidence: {
        model1: Number((model1Confidence * 100).toFixed(1)),
        model2: Number((model2Confidence * 100).toFixed(1)),
        average: Number(((model1Confidence + model2Confidence) / 2 * 100).toFixed(1))
      },
      
      modelAgreement: agreement,
      
      volatility: {
        value: Number(avgVolatility.toFixed(2)),
        level: avgVolatility < 2 ? 'Низкая' : avgVolatility < 5 ? 'Средняя' : 'Высокая'
      },
      
      recommendation: recommendation,
      recommendationDetails: {
        action: recommendation,
        confidence: Number(((model1Confidence + model2Confidence) / 2 * 100).toFixed(1)),
        timeframe: `${hours} часов`
      }
    },
    
    // Статистика
    statistics: {
      bullishCandles: forecastCandles.filter(c => c.close > c.open).length,
      bearishCandles: forecastCandles.filter(c => c.close < c.open).length,
      neutralCandles: forecastCandles.filter(c => c.close === c.open).length,
      maxGain: Number(Math.max(...forecastCandles.map(c => ((c.high - c.open) / c.open * 100))).toFixed(2)),
      maxLoss: Number(Math.min(...forecastCandles.map(c => ((c.low - c.open) / c.open * 100))).toFixed(2))
    }
  };
};

// Примеры прогнозов для разных активов
const sampleForecasts = {
  'GAZP': generateForecast({symbol: 'GAZP'}, 12, [
    {close: 180, open: 178, high: 182, low: 177},
    {close: 181, open: 180, high: 183, low: 179}
  ]),
  'SBER': generateForecast({symbol: 'SBER'}, 24, [
    {close: 320, open: 315, high: 325, low: 314},
    {close: 318, open: 320, high: 322, low: 317}
  ]),
  'AAPL': generateForecast({symbol: 'AAPL'}, 8, [
    {close: 150, open: 148, high: 152, low: 147},
    {close: 149, open: 150, high: 151, low: 148}
  ])
};

// API функции для работы с прогнозами
export const ForecastAPI = {
  // Получить прогноз для актива
  getForecast: async (asset, hours = 12, historicalData = []) => {
    console.log(`Запрос прогноза для ${asset.symbol} на ${hours} часов`);
    
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const forecast = generateForecast(asset, hours, historicalData);
    
    if (!forecast) {
      throw new Error('Не удалось сгенерировать прогноз');
    }
    
    return {
      success: true,
      data: forecast,
      message: `Прогноз сгенерирован на ${hours} часов`
    };
  },
  
  // Получить исторические прогнозы (для анализа точности)
  getForecastHistory: async (asset, limit = 10) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const history = [];
    for (let i = 0; i < limit; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      history.push({
        id: i + 1,
        date: date.toISOString(),
        asset: asset.symbol,
        forecastHours: 24,
        actualChange: (Math.random() * 10 - 5).toFixed(2),
        predictedChange: (Math.random() * 10 - 5).toFixed(2),
        accuracy: (70 + Math.random() * 25).toFixed(1),
        status: i < 3 ? 'В процессе' : 'Завершен'
      });
    }
    
    return {
      success: true,
      data: history,
      message: `Получено ${limit} исторических прогнозов`
    };
  },
  
  // Анализ точности моделей
  getModelAnalysis: async (asset) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      data: {
        asset: asset.symbol,
        models: [
          {
            name: 'LSTM Neural Network',
            accuracy: (75 + Math.random() * 20).toFixed(1),
            trainingDate: '2024-01-15',
            features: ['Цена', 'Объем', 'RSI', 'MACD'],
            confidence: (80 + Math.random() * 15).toFixed(1)
          },
          {
            name: 'Random Forest',
            accuracy: (70 + Math.random() * 25).toFixed(1),
            trainingDate: '2024-01-10',
            features: ['Технические индикаторы', 'Рыночные настроения'],
            confidence: (75 + Math.random() * 20).toFixed(1)
          }
        ],
        overallAccuracy: (72 + Math.random() * 23).toFixed(1),
        lastUpdated: new Date().toISOString()
      }
    };
  },
  
  // Быстрый прогноз (без деталей)
  getQuickForecast: async (asset) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const forecast = generateForecast(asset, 6, []);
    
    return {
      success: true,
      data: {
        asset: asset.symbol,
        direction: forecast.analysis.marketSignal,
        confidence: forecast.analysis.modelConfidence.average,
        recommendation: forecast.analysis.recommendation,
        timeframe: '6 часов'
      }
    };
  }
};

// Экспорт для использования в других компонентах
export default ForecastAPI;
export { generateForecast, sampleForecasts };