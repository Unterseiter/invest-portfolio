import React, { useState } from 'react';
import './SettingsPage.css';
import AppearanceSettings from './AppearanceSettings';
import CurrencySettings from './CurrencySettings';
import AboutSettings from './AboutSettings';

function SettingsPage() {
    const [activeSection, setActiveSection] = useState('currency');

    const settingsSections = [
        // { id: 'appearance', title: 'Внешний вид', icon: '' },
        { id: 'currency', title: 'Валюта и данные', icon: '' }
        // { id: 'about', title: 'О программе', icon: 'ℹ' }
    ];

    const renderSettingsContent = () => {
        switch (activeSection) {
            case 'currency':
                return <CurrencySettings />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'about':
                return <AboutSettings />;
            default:
                return (
                    <div className="setting-group">
                        <h3 className="setting-group__title">Раздел в разработке</h3>
                        <p className="setting-group__description">
                            Эта функциональность появится в ближайших обновлениях.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                {/* Верхняя навигация */}
                <nav className="settings-nav">
                    <div className="nav-container">
                        <ul className="nav-tabs">
                            {settingsSections.map((section) => (
                                <li key={section.id}>
                                    <button
                                        className={`nav-tab ${activeSection === section.id ? 'active' : ''}`}
                                        onClick={() => setActiveSection(section.id)}
                                    >
                                        <span className="nav-tab__icon">{section.icon}</span>
                                        <span className="nav-tab__text">{section.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* Основная область с настройками */}
                <main className="settings-content">
                    <div className="content-header">
                        <h2 className="content-title">
                            {settingsSections.find(s => s.id === activeSection)?.title}
                        </h2>
                        <p className="content-description">
                            Настройте параметры отображения и поведения приложения
                        </p>
                    </div>

                    <div className="settings-section">
                        {renderSettingsContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SettingsPage;