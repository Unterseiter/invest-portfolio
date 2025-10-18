import { useTheme } from '../../../contexts/ThemeContext'; // ← проверь путь и название файла
import React from 'react';
import './Header.css';
import '../../common/buttons/Buttons.css';
import Logo from '../../../assets/header/Logo';
import Sun from '../../../assets/header/Sun';

function Header() {
    const { currentTheme, toggleTheme } = useTheme();

    return(
        <header className="Header">
            <div className='logo'>
                <Logo width={100} color='var(--color-accent)'/>
                <h1 className='logo-text'>Invest Portfolio</h1>
            </div>
            <button onClick={toggleTheme} className='Theme-toggle-button'>
                <Sun width={35} color='var(--color-primary)' />
            </button>
        </header>
    )
}

export default Header;