// ForecastButton.jsx
import React, { useState } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './ForecastButton.css';

const ForecastButton = ({ asset, onForecastGenerated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [forecastHours, setForecastHours] = useState(12);
    const [showHoursSelector, setShowHoursSelector] = useState(false);
    
    const handleForecastClick = () => {
        if (!asset || !asset.id) {
            alert('Пожалуйста, выберите актив');
            return;
        }
        
        if (showHoursSelector) {
            setShowHoursSelector(false);
            return;
        }
        
        setShowHoursSelector(true);
    };
    
    const handleGenerateForecast = async () => {
        if (!asset || !asset.id || forecastHours < 1 || forecastHours > 24) {
            alert('Пожалуйста, выберите корректный период прогноза (1-24 часа)');
            return;
        }
        
        try {
            setIsLoading(true);
            setShowHoursSelector(false);
            
            // Получаем реальный прогноз
            const forecast = await PortfolioAPI.getMLForecast(asset.id, forecastHours);
            
            if (forecast && onForecastGenerated) {
                onForecastGenerated(forecast);
                alert(`Прогноз для ${asset.name} успешно сгенерирован!`);
            } else {
                alert('Не удалось получить данные прогноза');
            }
        } catch (error) {
            console.error('Ошибка при получении прогноза:', error);
            alert(`Ошибка: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleHoursChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 24) {
            setForecastHours(value);
        }
    };
    
    const handleCancel = () => {
        setShowHoursSelector(false);
    };
    
    return (
        <div className="forecast-button">
            {!showHoursSelector ? (
                <>
                    <button 
                        onClick={handleForecastClick}
                        className="forecast-btn"
                        disabled={!asset || !asset.id || isLoading}
                    >
                        {isLoading ? 'Загрузка...' : 'Сгенерировать прогноз'}
                    </button>
                    
                    <div className="forecast-info">
                        <p className="forecast-hint">
                            {asset?.id 
                                ? `Прогноз по ${asset.name}` 
                                : 'Выберите актив для получения прогноза'
                            }
                        </p>
                    </div>
                </>
            ) : (
                <div className="forecast-hours-selector">
                    <h4>Выберите период прогноза</h4>
                    <p className="selector-subtitle">На сколько часов сделать прогноз?</p>
                    
                    <div className="hours-input-group">
                        <input
                            type="range"
                            min="1"
                            max="24"
                            value={forecastHours}
                            onChange={handleHoursChange}
                            className="hours-slider"
                        />
                        <div className="hours-display">
                            <span className="hours-value">{forecastHours}</span>
                            <span className="hours-label">часов</span>
                        </div>
                    </div>
                    
                    <div className="hours-presets">
                        <button 
                            className={`hours-preset ${forecastHours === 6 ? 'active' : ''}`}
                            onClick={() => setForecastHours(6)}
                        >
                            6 часов
                        </button>
                        <button 
                            className={`hours-preset ${forecastHours === 12 ? 'active' : ''}`}
                            onClick={() => setForecastHours(12)}
                        >
                            12 часов
                        </button>
                        <button 
                            className={`hours-preset ${forecastHours === 24 ? 'active' : ''}`}
                            onClick={() => setForecastHours(24)}
                        >
                            24 часа
                        </button>
                    </div>
                    
                    <div className="selector-actions">
                        <button 
                            className="selector-btn cancel"
                            onClick={handleCancel}
                        >
                            Отмена
                        </button>
                        <button 
                            className="selector-btn generate"
                            onClick={handleGenerateForecast}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Генерация...' : 'Сгенерировать'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForecastButton;