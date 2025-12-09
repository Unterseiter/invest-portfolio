import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './CurrentPrice.css';
import ChartUp from "../../../../assets/Chart/ChartUp";
import { useCurrency } from '../../../../contexts/CurrencyContext';

const CurrentPrice = ({ asset }) => {
    const [priceData, setPriceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { formatPrice, formatChange, getCurrencySymbol } = useCurrency();

    useEffect(() => {
        const loadPriceData = async () => {
            if (!asset) {
                setPriceData(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Получаем биржевые данные для выбранного актива
                const stockData = await PortfolioAPI.getStockNameById(asset.id);
                
                if (stockData && stockData.table && stockData.table.length > 0) {
                    const priceTable = stockData.table;
                    // Сортируем по дате (от новых к старым)
                    const sortedTable = [...priceTable].sort((a, b) => 
                        new Date(b.date) - new Date(a.date)
                    );
                    
                    const latestPrice = sortedTable[0];
                    const previousPrice = sortedTable[1];
                    
                    if (latestPrice && previousPrice) {
                        const currentPrice = latestPrice.close;
                        const dailyChange = currentPrice - previousPrice.close;
                        const dailyChangePercent = previousPrice.close > 0 ? 
                            (dailyChange / previousPrice.close) * 100 : 0;

                        setPriceData({
                            currentPrice,
                            dailyChange,
                            dailyChangePercent,
                            lastUpdated: latestPrice.date
                        });
                    } else {
                        setError('Недостаточно данных о ценах');
                    }
                } else {
                    setError('Нет данных о ценах для выбранного актива');
                }

            } catch (err) {
                console.error('Ошибка загрузки данных цены:', err);
                setError('Не удалось загрузить данные цены');
            } finally {
                setLoading(false);
            }
        };

        loadPriceData();
    }, [asset]);

    if (!asset) {
        return (
            <div className="current-price">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Текущая цена</h3>
                </div>
                <div className="metric-content">
                    <div className="no-asset-text">Выберите актив</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="current-price loading">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Текущая цена</h3>
                </div>
                <div className="metric-content">
                    <div className="loading-text">Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error || !priceData) {
        return (
            <div className="current-price error">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-error)" />
                    <h3 className="metric-title">Текущая цена</h3>
                </div>
                <div className="metric-content">
                    <div className="error-text">{error || 'Нет данных'}</div>
                </div>
            </div>
        );
    }

    const { currentPrice, dailyChange, dailyChangePercent, lastUpdated } = priceData;
    const isPositive = dailyChange >= 0;

    // Форматирование даты обновления
    const formatUpdateDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            
            if (date.toDateString() === today.toDateString()) {
                return "Обновлено сегодня";
            } else {
                return `Обновлено ${date.toLocaleDateString('ru-RU')}`;
            }
        } catch (e) {
            return "Обновлено недавно";
        }
    };

    return (
        <div className="current-price">
            <div className="metric-header">
                <ChartUp width={24} height={24} color="var(--color-accent)" />
                <h3 className="metric-title">Текущая цена</h3>
            </div>
            
            <div className="metric-content">
                <div className="metric-value">{formatPrice(priceData?.currentPrice || 0)}</div>
                <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                    {formatChange(priceData?.dailyChange || 0, priceData?.dailyChangePercent || 0)}
                </div>
            </div>

            <div className="metric-footer">
                <div className="price-period">{formatUpdateDate(lastUpdated)}</div>
            </div>
        </div>
    );
};

export default CurrentPrice;