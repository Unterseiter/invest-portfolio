import React from 'react';
import './Sidebar.css';
import SidebarNavigate from '../../common/buttons/SidebarNavigate';
import AutoUpdateStatus from '../../common/AutoUpdateStatus/AutoUpdateStatus';

function Sidebar({ isOpen, onClose }) {
    const navigationItems = [
        { text: 'Главная', path: '/' },
        { text: 'Настройки', path: '/settings' },
        { text: 'Мониторинг активов', path: '/monitoring' },
        { text: 'Расчёт', path: '/functional' }
    ];

    return (
        <>
            {/* Overlay для мобильных */}
            <div 
                className={`sidebar__overlay ${isOpen ? 'sidebar__overlay--visible' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            
            <aside 
                className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} 
                role="navigation" 
                aria-label="Основная навигация"
            >
                <nav className="sidebar__nav">
                    <ul className="sidebar__list" role="list">
                        {navigationItems.map((item, index) => (
                            <li key={item.path} className="sidebar__item">
                                <SidebarNavigate 
                                    text={item.text} 
                                    path={item.path}
                                    index={index}
                                    onClick={onClose}
                                />
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
        <AutoUpdateStatus />
      </div>
            </aside>
        </>
    );
}

export default React.memo(Sidebar);