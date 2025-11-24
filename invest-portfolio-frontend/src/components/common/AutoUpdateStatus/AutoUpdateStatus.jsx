import React from 'react';
import { useAutoPortfolioUpdate } from '../../../hooks/useAutoPortfolioUpdate';
import './AutoUpdateStatus.css';

const AutoUpdateStatus = () => {
  const { isUpdating, lastUpdate, nextUpdate, error } = useAutoPortfolioUpdate();

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="auto-update-status">
      <div className="status-header">
        <span className="status-icon">🔄</span>
        <h4 className="status-title">Авто-обновление портфеля</h4>
      </div>
      
      <div className="status-content">
        <div className="status-item">
          <span className="status-label">Статус:</span>
          <span className={`status-value ${isUpdating ? 'status-updating' : 'status-idle'}`}>
            {isUpdating ? '🔄 Обновление...' : '✅ Ожидание'}
          </span>
        </div>
        
        {lastUpdate && (
          <div className="status-item">
            <span className="status-label">Последнее обновление:</span>
            <span className="status-value">
              <time dateTime={lastUpdate}>
                {formatTime(lastUpdate)}
              </time>
              <span className="status-date">{formatDate(lastUpdate)}</span>
            </span>
          </div>
        )}
        
        {nextUpdate && (
          <div className="status-item">
            <span className="status-label">Следующее обновление:</span>
            <span className="status-value">
              <time dateTime={nextUpdate}>
                {formatTime(nextUpdate)}
              </time>
              <span className="status-date">{formatDate(nextUpdate)}</span>
            </span>
          </div>
        )}
        
        {error && (
          <div className="status-error">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <strong className="error-title">Ошибка обновления</strong>
              <p className="error-message">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AutoUpdateStatus);