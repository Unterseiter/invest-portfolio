import React from 'react';
import './ForecastAnalysis.css';

const ForecastAnalysis = ({ forecastData, loading = false, error = null }) => {
    if (loading) {
        return (
            <div className="forecast-analysis">
                <div className="analysis-header">
                    <div className="title-section">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="var(--color-accent)"/>
                            <path d="M7 12H9V17H7V12ZM11 7H13V17H11V7ZM15 10H17V17H15V10Z" fill="var(--color-accent)"/>
                        </svg>
                        <h3 className="analysis-title">Аналитика прогноза</h3>
                    </div>
                </div>
                <div className="analysis-placeholder">
                    <div className="placeholder-content">
                        <h4>Загрузка анализа...</h4>
                        <p>Подождите, идет обработка данных ML модели</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="forecast-analysis">
                <div className="analysis-header">
                    <div className="title-section">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="var(--color-error)"/>
                        </svg>
                        <h3 className="analysis-title">Ошибка анализа</h3>
                    </div>
                </div>
                <div className="analysis-placeholder">
                    <div className="placeholder-content">
                        <h4>Ошибка загрузки</h4>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!forecastData) {
        return null;
    }
    
    const { analysis, statistics, forecastHours } = forecastData;
    const { marketSignal, modelConfidence, volatility, recommendation } = analysis;

    // Функция для получения цвета в зависимости от значения
    const getConfidenceColor = (value) => {
        if (value >= 80) return 'var(--color-success)';
        if (value >= 60) return 'var(--color-accent)';
        if (value >= 40) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    const getSignalColor = (signal) => {
        switch (signal) {
            case 'Рост': return 'var(--color-success)';
            case 'Падение': return 'var(--color-error)';
            case 'Боковик': return 'var(--color-warning)';
            default: return 'var(--color-secondary)';
        }
    };

    const getVolatilityColor = (value) => {
        if (value < 2) return 'var(--color-success)';
        if (value < 5) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    const getRecommendationColor = (rec) => {
        switch (rec) {
            case 'Покупать': return 'var(--color-success)';
            case 'Продавать': return 'var(--color-error)';
            case 'Держать позицию': return 'var(--color-warning)';
            default: return 'var(--color-secondary)';
        }
    };

    return (
        <div className="forecast-analysis">
            <div className="analysis-header">
                <div className="title-section">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="var(--color-accent)"/>
                        <path d="M7 12H9V17H7V12ZM11 7H13V17H11V7ZM15 10H17V17H15V10Z" fill="var(--color-accent)"/>
                    </svg>
                    <h3 className="analysis-title">Аналитика прогноза</h3>
                </div>
                <div className="forecast-period">
                    <span className="period-label">Прогноз на:</span>
                    <span className="period-value">{forecastHours} часов</span>
                </div>
            </div>

            <div className="analysis-content">
                <div className="analysis-grid">
                    {/* 1. Общий сигнал рынка */}
                    <div className="analysis-card signal-card">
                        <div className="card-header">
                            <h4 className="card-title">Общий сигнал рынка</h4>
                            <div className="card-subtitle">Направление движения цены</div>
                        </div>
                        <div className="card-content">
                            <div className="signal-indicator" style={{ color: getSignalColor(marketSignal) }}>
                                <div className="signal-value">{marketSignal}</div>
                                <div className="signal-change">
                                    {analysis.overallChangePercent >= 0 ? '+' : ''}{analysis.overallChangePercent}%
                                </div>
                            </div>
                            <div className="signal-description">
                                {marketSignal === 'Рост' && 'Рынок демонстрирует восходящий тренд'}
                                {marketSignal === 'Падение' && 'Рынок демонстрирует нисходящий тренд'}
                                {marketSignal === 'Боковик' && 'Рынок находится в боковом движении'}
                            </div>
                        </div>
                    </div>

                    {/* 2. Надежность модели */}
                    <div className="analysis-card confidence-card">
                        <div className="card-header">
                            <h4 className="card-title">Надежность модели</h4>
                            <div className="card-subtitle">Уверенность в прогнозе</div>
                        </div>
                        <div className="card-content">
                            <div className="confidence-model">
                                <div className="model-info">
                                    <div className="model-name">Трендовая модель</div>
                                    <div className="model-value" style={{ color: getConfidenceColor(modelConfidence.model1) }}>
                                        {modelConfidence.model1}%
                                    </div>
                                </div>
                                <div className="confidence-bar-container">
                                    <div 
                                        className="confidence-bar"
                                        style={{
                                            width: `${modelConfidence.model1}%`,
                                            backgroundColor: getConfidenceColor(modelConfidence.model1)
                                        }}
                                    />
                                </div>
                            </div>
                            
                            <div className="confidence-summary">
                                <span className="summary-label">Уверенность прогноза:</span>
                                <span className="summary-value" style={{ color: getConfidenceColor(modelConfidence.average) }}>
                                    {modelConfidence.average}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Волатильность прогноза */}
                    <div className="analysis-card volatility-card">
                        <div className="card-header">
                            <h4 className="card-title">Волатильность прогноза</h4>
                            <div className="card-subtitle">Стабильность предсказаний</div>
                        </div>
                        <div className="card-content">
                            <div className="volatility-display">
                                <div className="volatility-value" style={{ color: getVolatilityColor(volatility.value) }}>
                                    {volatility.value}%
                                </div>
                                <div className="volatility-level" style={{ color: getVolatilityColor(volatility.value) }}>
                                    {volatility.level}
                                </div>
                            </div>
                            <div className="volatility-description">
                                {volatility.level === 'Низкая' && 'Низкая волатильность означает стабильный прогноз'}
                                {volatility.level === 'Средняя' && 'Средняя волатильность — умеренный риск'}
                                {volatility.level === 'Высокая' && 'Высокая волатильность — повышенный риск'}
                            </div>
                        </div>
                    </div>

                    {/* 4. Рекомендация к действию */}
                    <div className="analysis-card recommendation-card">
                        <div className="card-header">
                            <h4 className="card-title">Рекомендация к действию</h4>
                            <div className="card-subtitle">На основе анализа</div>
                        </div>
                        <div className="card-content">
                            <div className="recommendation-main">
                                <div className="recommendation-action" style={{ color: getRecommendationColor(recommendation) }}>
                                    {recommendation}
                                </div>
                                <div className="recommendation-confidence">
                                    Уверенность: {analysis.recommendationDetails.confidence}%
                                </div>
                            </div>
                            <div className="recommendation-details">
                                <div className="detail-item">
                                    <span className="detail-label">Время удержания:</span>
                                    <span className="detail-value">{analysis.recommendationDetails.timeframe}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Оптимальный вход:</span>
                                    <span className="detail-value">В течение 1-2 часов</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Уровень риска:</span>
                                    <span className="detail-value" style={{ color: getVolatilityColor(volatility.value) }}>
                                        {volatility.level}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Статистика прогноза - растягиваем на 2 колонки */}
                    <div className="analysis-card stats-card">
                        <div className="card-header">
                            <h4 className="card-title">Статистика прогноза</h4>
                            <div className="card-subtitle">Распределение свечей</div>
                        </div>
                        <div className="card-content">
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                                        {statistics.bullishCandles}
                                    </div>
                                    <div className="stat-label">Ростовых свечей</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: 'var(--color-error)' }}>
                                        {statistics.bearishCandles}
                                    </div>
                                    <div className="stat-label">Падающих свечей</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
                                        {statistics.neutralCandles}
                                    </div>
                                    <div className="stat-label">Нейтральных свечей</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                                        +{statistics.maxGain}%
                                    </div>
                                    <div className="stat-label">Максимальный рост</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: 'var(--color-error)' }}>
                                        {statistics.maxLoss}%
                                    </div>
                                    <div className="stat-label">Максимальное падение</div>
                                </div>
                            </div>
                            <div className="stats-summary">
                                Всего свечей в прогнозе: {statistics.bullishCandles + statistics.bearishCandles + statistics.neutralCandles}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analysis-footer">
                <div className="timestamp">
                    Сгенерировано: {new Date(forecastData.generatedAt).toLocaleString('ru-RU')}
                </div>
                <div className="disclaimer">
                    Прогноз основан на исторических данных и может не отражать будущие результаты
                </div>
            </div>
        </div>
    );
};

export default ForecastAnalysis;