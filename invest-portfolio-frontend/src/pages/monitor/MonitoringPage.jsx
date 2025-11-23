import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../services/portfolioAPI';
import AssetSelector from '../../components/common/AssetSelector/AssetSelector';
import CurrentPrice from '../../components/common/actives/CurrentPrice/CurrentPrice';
import BuyAsset from '../../components/common/buttons/BuyAsset/BuyAsset';
import ForecastButton from '../../components/common/buttons/ForecastButton/ForecastButton';
import AssetChart from '../../components/common/Graphics/Candle/AssetChart';
import "./MonitoringPage.css";

function MonitoringPage() {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [portfolioTotal, setPortfolioTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPortfolioTotal = async () => {
            try {
                setLoading(true);
                const portfolios = await PortfolioAPI.getPortfolios();
                
                if (portfolios && portfolios.length > 0) {
                    const latestPortfolio = portfolios[portfolios.length - 1];
                    setPortfolioTotal(latestPortfolio.total_value || 0);
                }
            } catch (error) {
                console.error('Ошибка загрузки данных портфеля:', error);
                setError('Не удалось загрузить данные портфеля');
            } finally {
                setLoading(false);
            }
        };

        loadPortfolioTotal();
    }, []);

    const handleAssetSelect = (asset) => {
        console.log('Выбран актив:', asset);
        setSelectedAsset(asset);
    };

    if (loading) {
        return (
            <div className="monitoring-page loading">
                <div className="loading-content">
                    <h2>Загрузка данных...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="monitoring-page error">
                <div className="error-content">
                    <h2>Ошибка загрузки</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="monitoring-page">
            {/* Селектор актива */}
            <div className="monitoring-section">
                <AssetSelector 
                    onAssetSelect={handleAssetSelect}
                    selectedAsset={selectedAsset}
                />
            </div>

            {/* Три основных компонента */}
            <div className="main-action-grid">
                <div className="price-section">
                    <CurrentPrice asset={selectedAsset} />
                </div>
                <div className="actions-section">
                    <BuyAsset asset={selectedAsset} />
                    <ForecastButton asset={selectedAsset} />
                </div>
            </div>

            {/* График актива */}
            <div className="chart-section">
                <AssetChart asset={selectedAsset} />
            </div>
        </div>
    )
}

export default MonitoringPage;