import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './PurchaseInfo.css';
import ChartUp from "../../../../assets/Chart/ChartUp";
import { useCurrency } from '../../../../contexts/CurrencyContext';

const PurchaseInfo = ({ asset }) => {
    const [purchaseData, setPurchaseData] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        const loadPurchaseData = async () => {
            if (!asset) {
                setPurchaseData(null);
                setCurrentPrice(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Получаем текущую цену актива
                const stockData = await PortfolioAPI.getStockNameById(asset.id);
                
                if (stockData && stockData.table && stockData.table.length > 0) {
                    const priceTable = stockData.table;
                    // Сортируем по дате (от новых к старым)
                    const sortedTable = [...priceTable].sort((a, b) => 
                        new Date(b.date) - new Date(a.date)
                    );
                    
                    const latestPrice = sortedTable[0]?.close;
                    setCurrentPrice(latestPrice);

                    // Используем данные из актива для информации о покупке
                    if (asset.price && asset.quantity) {
                        const purchasePrice = asset.price;
                        const totalReturn = latestPrice && purchasePrice > 0 ? 
                            ((latestPrice - purchasePrice) / purchasePrice * 100) : 0;
                        
                        // Для даты покупки используем текущую дату (так как в API нет даты покупки)
                        // В реальном приложении эта дата должна приходить из API
                        const purchaseDate = new Date().toISOString().split('T')[0];
                        
                        // Расчет дней в портфеле (условно)
                        const purchaseDateObj = new Date(purchaseDate);
                        const today = new Date();
                        const daysInPortfolio = Math.floor((today - purchaseDateObj) / (1000 * 60 * 60 * 24));

                        setPurchaseData({
                            purchasePrice,
                            purchaseDate,
                            totalReturn,
                            daysInPortfolio
                        });
                    } else {
                        setError('Нет данных о покупке актива');
                    }
                } else {
                    setError('Нет данных о ценах для выбранного актива');
                }

            } catch (err) {
                console.error('Ошибка загрузки данных о покупке:', err);
                setError('Не удалось загрузить данные о покупке');
            } finally {
                setLoading(false);
            }
        };

        loadPurchaseData();
    }, [asset]);

    if (!asset) {
        return (
            <div className="purchase-info">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Информация о покупке</h3>
                </div>
                <div className="metric-content">
                    <div className="no-asset-text">Выберите актив</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="purchase-info loading">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Информация о покупке</h3>
                </div>
                <div className="metric-content">
                    <div className="loading-text">Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error || !purchaseData) {
        return (
            <div className="purchase-info error">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-error)" />
                    <h3 className="metric-title">Информация о покупке</h3>
                </div>
                <div className="metric-content">
                    <div className="error-text">{error || 'Нет данных'}</div>
                </div>
            </div>
        );
    }

    const { purchasePrice, purchaseDate, totalReturn, daysInPortfolio } = purchaseData;
    const isPositive = totalReturn >= 0;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getHoldingPeriodText = (days) => {
        if (days === 1) return 'В портфеле 1 день';
        if (days >= 2 && days <= 4) return `В портфеле ${days} дня`;
        return `В портфеле ${days} дней`;
    };

    return (
        <div className="purchase-info">
            <div className="metric-header">
                <ChartUp width={24} height={24} color="var(--color-accent)" />
                <h3 className="metric-title">Информация о покупке</h3>
            </div>
            
            <div className="metric-content">
                <div className="info-item">
                    <span className="info-label">Цена покупки:</span>
                    <span className="info-value">{formatPrice(purchaseData?.purchasePrice || 0)}</span>
                </div>
                
                <div className="info-item">
                    <span className="info-label">Дата покупки:</span>
                    <span className="info-value">{formatDate(purchaseDate)}</span>
                </div>
                
                <div className="info-item">
                    <span className="info-label">Доходность:</span>
                    <span className={`info-value ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{totalReturn.toFixed(1)}%
                    </span>
                </div>
            </div>

            <div className="metric-footer">
                <div className="holding-period">{getHoldingPeriodText(daysInPortfolio)}</div>
            </div>
        </div>
    );
};

export default PurchaseInfo;