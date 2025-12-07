import React, { useState } from 'react';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './BuyAsset.css';

const BuyAsset = ({ asset }) => {
    const [quantity, setQuantity] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleBuyClick = () => {
        if (!asset) {
            alert('Пожалуйста, выберите актив');
            return;
        }
        if (!quantity || quantity <= 0) {
            alert('Пожалуйста, укажите количество');
            return;
        }
        setShowModal(true);
    };

    const handleConfirmBuy = async () => {
        try {
            setLoading(true);
            
            // Получаем текущий портфель
            const portfolios = await PortfolioAPI.getPortfolios();
            if (!portfolios || portfolios.length === 0) {
                alert('Нет активного портфеля. Создайте портфель сначала.');
                return;
            }

            const latestPortfolio = portfolios[portfolios.length - 1];
            const userId = latestPortfolio.id || 1;

            // Добавляем актив в портфель через API
            const result = await PortfolioAPI.addTableSecurity(
                userId,
                asset.securitie_id || asset.id, // ID акции из stock_names
                parseInt(quantity)
            );

            if (result.success) {
                alert(`Актив ${asset.symbol} успешно добавлен в портфель в количестве ${quantity} шт.`);
                setShowModal(false);
                setQuantity('');
                
                // Обновляем страницу чтобы показать изменения
                window.location.reload();
            } else {
                throw new Error(result.message || 'Ошибка при добавлении актива');
            }

        } catch (error) {
            console.error('Ошибка при покупке актива:', error);
            alert(`Ошибка при покупке актива: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBuy = () => {
        setShowModal(false);
    };

    if (!asset) {
        return (
            <div className="buy-asset disabled">
                <h3>Покупка актива</h3>
                <p>Выберите актив для покупки</p>
            </div>
        );
    }

    return (
        <div className="buy-asset">
            <h3>Покупка {asset.symbol}</h3>
            
            <div className="buy-form">
                <div className="quantity-input-group">
                    <label htmlFor="quantity">Количество:</label>
                    <input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Введите количество"
                        min="1"
                        className="quantity-inputs"
                    />
                </div>
                
                <button 
                    onClick={handleBuyClick}
                    className="buy-button"
                    disabled={!quantity || quantity <= 0 || loading}
                >
                    {loading ? 'Добавление...' : `Купить ${asset.symbol}`}
                </button>
            </div>

            {/* Модальное окно подтверждения */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Подтверждение покупки</h3>
                        <p>Вы уверены, что хотите купить {quantity} шт. актива {asset.symbol}?</p>
                        
                        <div className="purchase-details">
                            <div className="detail-item">
                                <span>Актив:</span>
                                <span>{asset.symbol} - {asset.name}</span>
                            </div>
                            <div className="detail-item">
                                <span>Количество:</span>
                                <span>{quantity} шт.</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                onClick={handleConfirmBuy}
                                className="confirm-button"
                                disabled={loading}
                            >
                                {loading ? 'Добавление...' : 'Подтвердить покупку'}
                            </button>
                            <button 
                                onClick={handleCancelBuy}
                                className="cancel-button"
                                disabled={loading}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyAsset;