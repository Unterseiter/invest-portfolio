import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './TotalAssetValue.css';
import ChartUp from "../../../../assets/Chart/ChartUp";

const TotalAssetValue = ({ asset, portfolioTotal }) => {
    const [assetValue, setAssetValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAssetValue = async () => {
            if (!asset) {
                setAssetValue(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Получаем текущую цену актива
                const stockData = await PortfolioAPI.getStockNameById(asset.id);
                
                if (stockData && stockData.table && stockData.table.length > 0) {
                    const latestPrice = stockData.table[0]?.close;
                    
                    if (latestPrice && asset.quantity) {
                        const totalValue = latestPrice * asset.quantity;
                        const percentage = portfolioTotal > 0 ? 
                            ((totalValue / portfolioTotal) * 100) : 0;

                        setAssetValue({
                            totalValue,
                            percentage
                        });
                    } else {
                        setError('Недостаточно данных для расчета стоимости');
                    }
                } else {
                    setError('Нет данных о ценах для выбранного актива');
                }

            } catch (err) {
                console.error('Ошибка загрузки данных стоимости:', err);
                setError('Не удалось загрузить данные стоимости');
            } finally {
                setLoading(false);
            }
        };

        loadAssetValue();
    }, [asset, portfolioTotal]);

    if (!asset) {
        return (
            <div className="total-asset-value">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Общая стоимость</h3>
                </div>
                <div className="metric-content">
                    <div className="no-asset-text">Выберите актив</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="total-asset-value loading">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Общая стоимость</h3>
                </div>
                <div className="metric-content">
                    <div className="loading-text">Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error || !assetValue) {
        return (
            <div className="total-asset-value error">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-error)" />
                    <h3 className="metric-title">Общая стоимость</h3>
                </div>
                <div className="metric-content">
                    <div className="error-text">{error || 'Нет данных'}</div>
                </div>
            </div>
        );
    }

    const { totalValue, percentage } = assetValue;

    return (
        <div className="total-asset-value">
            <div className="metric-header">
                <ChartUp width={24} height={24} color="var(--color-accent)" />
                <h3 className="metric-title">Общая стоимость</h3>
            </div>
            
            <div className="metric-content">
                <div className="metric-value">${totalValue.toLocaleString('ru-RU')}</div>
                <div className="metric-subtitle">{percentage.toFixed(1)}% от портфеля</div>
            </div>
        </div>
    );
};

export default TotalAssetValue;