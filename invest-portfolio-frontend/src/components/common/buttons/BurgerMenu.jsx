import React from 'react';
import './Buttons.css';

function BurgerMenu({ isOpen, onToggle, className = '' }) {
    return (
        <button
            className={`burger-menu ${isOpen ? 'burger-menu--open' : ''} ${className}`}
            onClick={onToggle}
            aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isOpen}
        >
            <span className="burger-menu__line"></span>
            <span className="burger-menu__line"></span>
            <span className="burger-menu__line"></span>
        </button>
    );
}

export default React.memo(BurgerMenu);