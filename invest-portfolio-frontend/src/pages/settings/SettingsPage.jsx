import React, { useState } from 'react';
import './SettingsPage.css';
import Sun from '../../assets/header/Sun';
import Moon from '../../assets/header/Moon';
import Gear from '../../assets/Gear';

function SettingsPage() {
    const [activeSection, setActiveSection] = useState('appearance');

    const settingsSections = [
        { id: 'appearance', title: 'Внешний вид'},
        { id: 'currency', title: 'Валюта и данные'},
        // { id: 'notifications', title: 'Уведомления'},
        // { id: 'analytics', title: 'Аналитика и ИИ'},
        // { id: 'data', title: 'Импорт/экспорт'},
        { id: 'about', title: 'О программе'}
    ];

    return (
        <div className="settings-page">
            <div className="settings-container">
                {/* Боковая панель с разделами */}
                <aside className="settings-sidebar">
                    <div className="sidebar-header">
                        <h2 className="sidebar-title">Настройки</h2>
                    </div>
                    
                    <nav className="sidebar-nav">
                        <ul className="nav-list">
                            {settingsSections.map((section) => (
                                <li key={section.id} className="nav-item">
                                    <button
                                        className={`nav-button ${activeSection === section.id ? 'nav-button--active' : ''}`}
                                        onClick={() => setActiveSection(section.id)}
                                    >
                                        <span className="nav-icon">{section.icon}</span>
                                        <span className="nav-text">{section.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Основная область с настройками */}
                <main className="settings-content">
                    <div className="content-header">
                        <h1 className="content-title">
                            {settingsSections.find(s => s.id === activeSection)?.title}
                        </h1>
                        <p className="content-description">
                            Настройте параметры отображения и поведения приложения
                        </p>
                    </div>

                    <div className="settings-section">
                        {/* Пример настройки - Внешний вид */}
                        {activeSection === 'appearance' && (
                            <div className="setting-group">
                                <h3 className="setting-group__title">Цветовая тема</h3>
                                <div className="setting-options">
                                    <label className="setting-option">
                                        <input 
                                            type="radio" 
                                            name="theme" 
                                            value="light" 
                                            className="setting-option__input"
                                        />
                                        <span className="setting-option__label">
                                            <span className="option-icon"> <Sun 
                                                                                width={25}
                                                                                height={25}
                                                                                /></span>
                                            Светлая тема
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
                                            <span className="option-icon"><Moon 
                                                                                width={25}
                                                                                height={25}
                                                                                /></span>
                                            Темная тема
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
                                            <span className="option-icon"><Gear 
                                                                                width={25}
                                                                                height={25}
                                                                                /></span>
                                            Системная
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Пример настройки - Валюта */}
                        {activeSection === 'currency' && (
                            <div className="setting-group">
                                <h3 className="setting-group__title">Основная валюта</h3>
                                <div className="setting-options">
                                    <label className="setting-option">
                                        <input 
                                            type="radio" 
                                            name="currency" 
                                            value="RUB" 
                                            className="setting-option__input"
                                        />
                                        <span className="setting-option__label">
                                            <span className="option-text">Российский рубль (RUB)</span>
                                        </span>
                                    </label>
                                    
                                    <label className="setting-option">
                                        <input 
                                            type="radio" 
                                            name="currency" 
                                            value="USD" 
                                            className="setting-option__input"
                                        />
                                        <span className="setting-option__label">
                                            <span className="option-text">Доллар США (USD)</span>
                                        </span>
                                    </label>
                                    
                                    <label className="setting-option">
                                        <input 
                                            type="radio" 
                                            name="currency" 
                                            value="EUR" 
                                            className="setting-option__input"
                                        />
                                        <span className="setting-option__label">
                                            <span className="option-text">Евро (EUR)</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Заглушки для остальных разделов */}
                        {!['appearance', 'currency'].includes(activeSection) && (
                            <div className="setting-group">
                                <h3 className="setting-group__title">Раздел в разработке</h3>
                                <p className="setting-group__description">
                                    Эта функциональность появится в ближайших обновлениях.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SettingsPage;