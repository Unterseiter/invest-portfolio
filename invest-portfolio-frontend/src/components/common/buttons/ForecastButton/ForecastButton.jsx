import React from 'react';
import './ForecastButton.css';

const ForecastButton = ({ asset }) => {
    const handleForecastClick = () => {
        if (!asset) {
            alert('Пожалуйста, выберите актив');
            return;
        }
        // Заглушка для функционала прогноза
        alert(`Функция прогноза для ${asset.symbol} в разработке`);
    };

    return (
        <div className="forecast-button">
            <button 
                onClick={handleForecastClick}
                className="forecast-btn"
                disabled={!asset}
            >
                Прогноз
            </button>
            <p className="forecast-hint">
                {asset 
                    ? `Получить прогноз по ${asset.symbol}` 
                    : 'Выберите актив для получения прогноза'
                }
            </p>
        </div>
    );
};

export default ForecastButton;