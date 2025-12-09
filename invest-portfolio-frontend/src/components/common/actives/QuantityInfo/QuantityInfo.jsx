import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './QuantityInfo.css';
import ChartUp from "../../../../assets/Chart/ChartUp";
import { useCurrency } from '../../../../contexts/CurrencyContext';

const QuantityInfo = ({ asset }) => {
    const [quantityData, setQuantityData] = useState(null);
    const [portfolioTotal, setPortfolioTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        const loadQuantityData = async () => {
            if (!asset) {
                setQuantityData(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Получаем портфель для расчета общей стоимости
                const portfolios = await PortfolioAPI.getPortfolios();
                if (!portfolios || portfolios.length === 0) {
                    setError('Нет данных портфеля');
                    return;
                }

                const latestPortfolio = portfolios[portfolios.length - 1];
                const totalPortfolioValue = latestPortfolio.total_value || 0;
                setPortfolioTotal(totalPortfolioValue);

                // Получаем текущую цену для расчета текущей стоимости
                const stockData = await PortfolioAPI.getStockNameById(asset.id);
                const currentPrice = stockData?.table?.[0]?.close || asset.price || 0;

                // Используем данные из актива
                if (asset.quantity && asset.price) {
                    const quantity = asset.quantity;
                    const averagePrice = asset.price; // В API это цена покупки
                    const totalInvestment = quantity * averagePrice;
                    const currentValue = quantity * currentPrice;
                    
                    // Расчет доли в портфеле
                    const portfolioAllocation = totalPortfolioValue > 0 ? 
                        (currentValue / totalPortfolioValue) * 100 : 0;

                    setQuantityData({
                        quantity,
                        averagePrice,
                        totalInvestment,
                        currentValue,
                        portfolioAllocation
                    });
                } else {
                    setError('Нет данных о количестве актива');
                }

            } catch (err) {
                console.error('Ошибка загрузки данных о количестве:', err);
                setError('Не удалось загрузить данные о количестве');
            } finally {
                setLoading(false);
            }
        };

        loadQuantityData();
    }, [asset]);

    if (!asset) {
        return (
            <div className="quantity-info">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Количество в портфеле</h3>
                </div>
                <div className="metric-content">
                    <div className="no-asset-text">Выберите актив</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="quantity-info loading">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-tertiary)" />
                    <h3 className="metric-title">Количество в портфеле</h3>
                </div>
                <div className="metric-content">
                    <div className="loading-text">Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error || !quantityData) {
        return (
            <div className="quantity-info error">
                <div className="metric-header">
                    <ChartUp width={24} height={24} color="var(--color-error)" />
                    <h3 className="metric-title">Количество в портфеле</h3>
                </div>
                <div className="metric-content">
                    <div className="error-text">{error || 'Нет данных'}</div>
                </div>
            </div>
        );
    }

    const { quantity, averagePrice, totalInvestment, portfolioAllocation } = quantityData;

    return (
        <div className="quantity-info">
            <div className="metric-header">
                <ChartUp width={24} height={24} color="var(--color-accent)" />
                <h3 className="metric-title">Количество в портфеле</h3>
            </div>
            
            <div className="metric-content">
                <div className="quantity-value">{quantity.toLocaleString('ru-RU')} шт.</div>
                
                <div className="quantity-details">
                    <div className="detail-item">
                        <span className="detail-label">Цена покупки:</span>
                        <span className="detail-value">{formatPrice(averagePrice)}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Сумма покупки:</span>
                        <span className="detail-value">{formatPrice(totalInvestment)}</span>
                    </div>
                </div>
            </div>

            <div className="metric-footer">
                <div className="allocation-info">
                    Доля в портфеле: {portfolioAllocation.toFixed(1)}%
                </div>
            </div>
        </div>
    );
};

export default QuantityInfo;