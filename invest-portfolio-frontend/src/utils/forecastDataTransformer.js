// utils/forecastDataTransformer.js

/**
 * Трансформирует данные ML прогноза в формат для UI
 */
export const transformMLForecastToUI = (mlForecast) => {
    if (!mlForecast) return null;
    
    try {
        const { 
            table_predictions, 
            market_signal, 
            assurance, 
            balance, 
            volatility, 
            recommendation_signal 
        } = mlForecast;
        
        // Используем table_predictions вместо predictions
        const predictions = table_predictions || [];
        
        // Рассчитываем статистику
        const stats = calculatePredictionStats(predictions);
        
        // Форматируем данные для ForecastAnalysis
        return {
            analysis: {
                marketSignal: translateSignal(market_signal),
                modelConfidence: {
                    model1: Math.round((assurance || 0.5) * 100),
                    model2: 100 - Math.round((assurance || 0.5) * 100),
                    average: Math.round((assurance || 0.5) * 100)
                },
                modelAgreement: market_signal === balance ? 'Согласованы' : 'Расходятся',
                volatility: {
                    value: parseFloat(volatility) || 3.5,
                    level: getVolatilityLevel(volatility)
                },
                recommendation: translateRecommendation(recommendation_signal),
                overallChangePercent: calculateOverallChange(predictions),
                recommendationDetails: {
                    confidence: Math.round((assurance || 0.5) * 100),
                    timeframe: `${predictions.length} часов`
                }
            },
            statistics: stats,
            forecastHours: predictions.length,
            generatedAt: new Date().toISOString(),
            forecastCandles: formatForecastCandles(predictions)
        };
    } catch (error) {
        console.error('Error transforming forecast data:', error);
        return null;
    }
};

const calculatePredictionStats = (predictions) => {
    if (!predictions || predictions.length === 0) {
        return {
            bullishCandles: 0,
            bearishCandles: 0,
            neutralCandles: 0,
            maxGain: 0,
            maxLoss: 0
        };
    }
    
    let bullish = 0;
    let bearish = 0;
    let maxGain = 0;
    let maxLoss = 0;
    
    predictions.forEach(pred => {
        const change = pred.close - pred.open;
        const changePercent = pred.open !== 0 ? (change / pred.open * 100) : 0;
        
        if (change > 0) {
            bullish++;
            maxGain = Math.max(maxGain, changePercent);
        } else if (change < 0) {
            bearish++;
            maxLoss = Math.min(maxLoss, changePercent);
        }
    });
    
    return {
        bullishCandles: bullish,
        bearishCandles: bearish,
        neutralCandles: predictions.length - bullish - bearish,
        maxGain: maxGain.toFixed(2),
        maxLoss: Math.abs(maxLoss).toFixed(2)
    };
};

const translateSignal = (signal) => {
    const signalMap = {
        'buy': 'Рост',
        'sell': 'Падение',
        'hold': 'Боковик'
    };
    return signalMap[signal?.toLowerCase()] || 'Боковик';
};

const translateRecommendation = (recommendation) => {
    const recMap = {
        'buy': 'Покупать',
        'sell': 'Продавать',
        'hold': 'Держать позицию'
    };
    return recMap[recommendation?.toLowerCase()] || 'Держать позицию';
};

const getVolatilityLevel = (volatility) => {
    const vol = parseFloat(volatility) || 0;
    if (vol < 2) return 'Низкая';
    if (vol < 5) return 'Средняя';
    return 'Высокая';
};

const calculateOverallChange = (predictions) => {
    if (!predictions || predictions.length < 2) return 0;
    const first = predictions[0]?.close || 0;
    const last = predictions[predictions.length - 1]?.close || 0;
    if (first === 0) return 0;
    return ((last - first) / first * 100).toFixed(2);
};

const formatForecastCandles = (predictions) => {
    if (!predictions) return [];
    
    return predictions.map((pred, index) => ({
        timestamp: new Date(Date.now() + (index + 1) * 60 * 60 * 1000).getTime(),
        date: pred.date || new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toISOString(),
        open: pred.open || 0,
        high: pred.high || 0,
        low: pred.low || 0,
        close: pred.close || 0,
        isForecast: true,
        volume: 0
    }));
};