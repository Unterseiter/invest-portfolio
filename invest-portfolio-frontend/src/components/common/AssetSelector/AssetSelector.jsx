import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../services/portfolioAPI';
import './AssetSelector.css';

const AssetSelector = ({ onAssetSelect, selectedAsset }) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('Загрузка всех доступных акций...');

                // Загружаем все доступные акции
                const stocks = await PortfolioAPI.getStockNames();
                console.log('Все доступные акции:', stocks);

                if (!stocks || stocks.length === 0) {
                    setError('Нет доступных акций');
                    setAssets([]);
                    return;
                }

                // Преобразуем акции в нужный формат
                const allAssets = stocks.map(stock => ({
                    id: stock.id, // ID из stock_names
                    securitie_id: stock.id, // То же самое (для API запросов)
                    symbol: stock.name, // Используем name как тикер
                    name: stock.full_name || stock.name, // Полное название или name
                    type: 'stock'
                }));

                console.log('Преобразованные активы:', allAssets);
                setAssets(allAssets);

            } catch (error) {
                console.error('Ошибка загрузки активов:', error);
                setError('Не удалось загрузить данные активов');
                setAssets([]);
            } finally {
                setLoading(false);
            }
        };

        loadAssets();
    }, []);

    const handleAssetSelect = (selectedValue) => {
        const asset = assets.find(a => a.id === parseInt(selectedValue));
        console.log('Выбран актив:', asset);
        onAssetSelect(asset);
    };

    if (loading) {
        return (
            <div className="asset-selector loading">
                <div className="selector-header">
                    <h3>Выбор актива</h3>
                </div>
                <div className="selector-content">
                    <div className="loading-text">Загрузка активов...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="asset-selector error">
                <div className="selector-header">
                    <h3>Выбор актива</h3>
                </div>
                <div className="selector-content">
                    <div className="error-text">{error}</div>
                </div>
            </div>
        );
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="asset-selector">
                <div className="selector-header">
                    <h3>Выбор актива</h3>
                </div>
                <div className="selector-content">
                    <div className="no-data-text">Нет доступных акций</div>
                </div>
            </div>
        );
    }

    return (
        <div className="asset-selector">
            <div className="selector-header">
                <h3>Выбор актива</h3>
            </div>
            
            <div className="selector-content">
                <select 
                    value={selectedAsset?.id || ''} 
                    onChange={(e) => handleAssetSelect(e.target.value)}
                    className="asset-select"
                >
                    <option value="">Выберите актив</option>
                    {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                            {asset.symbol} - {asset.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default AssetSelector;