import React from 'react';
import Sun from '../../assets/header/Sun';
import Moon from '../../assets/header/Moon';
import Gear from '../../assets/Gear';

function AppearanceSettings() {
    return (
        <>
            <div className="setting-group">
                <h3 className="setting-group__title">Цветовая тема</h3>
                <p className="setting-group__description">
                    Выберите тему оформления приложения
                </p>
                <div className="setting-options">
                    <label className="setting-option">
                        <input 
                            type="radio" 
                            name="theme" 
                            value="light" 
                            className="setting-option__input"
                        />
                        <span className="setting-option__label">
                            <span className="option-icon">
                                <Sun width={25} height={25} />
                            </span>
                            <span className="option-text">Светлая тема</span>
                        </span>
                    </label>
                    
                    <label className="setting-option">
                        <input 
                            type="radio" 
                            name="theme" 
                            value="dark" 
                            className="setting-option__input"
                        />
                        <span className="setting-option__label">
                            <span className="option-icon">
                                <Moon width={25} height={25} />
                            </span>
                            <span className="option-text">Темная тема</span>
                        </span>
                    </label>
                    
                    <label className="setting-option">
                        <input 
                            type="radio" 
                            name="theme" 
                            value="auto" 
                            className="setting-option__input"
                        />
                        <span className="setting-option__label">
                            <span className="option-icon">
                                <Gear width={25} height={25} />
                            </span>
                            <span className="option-text">Системная</span>
                        </span>
                    </label>
                </div>
            </div>

            <div className="setting-group">
                <h3 className="setting-group__title">Плотность интерфейса</h3>
                <p className="setting-group__description">
                    Настройте размеры элементов интерфейса
                </p>
                <div className="setting-options">
                    <label className="setting-option">
                        <input 
                            type="radio" 
                            name="density" 
                            value="compact" 
                            className="setting-option__input"
                        />
                        <span className="setting-option__label">
                            <span className="option-text">Компактный</span>
                        </span>
                    </label>
                    
                    <label className="setting-option">
                        <input 
                            type="radio" 
                            name="density" 
                            value="normal" 
                            className="setting-option__input"
                        />
                        <span className="setting-option__label">
                            <span className="option-text">Обычный</span>
                        </span>
                    </label>
                    
                    <label className="setting-option">
                        <input 
                            type="radio" 
                            name="density" 
                            value="comfortable" 
                            className="setting-option__input"
                        />
                        <span className="setting-option__label">
                            <span className="option-text">Комфортный</span>
                        </span>
                    </label>
                </div>
            </div>
        </>
    );
}

export default AppearanceSettings;