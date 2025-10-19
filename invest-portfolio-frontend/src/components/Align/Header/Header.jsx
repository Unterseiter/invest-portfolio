import React from 'react';
import './Header.css';
import Logo from '../../../assets/header/Logo';
import ThemeToggle from '../../common/buttons/ThemeToggle';

function Header() {

    return(
        <header className="Header">
            <div className='logo'>
                <Logo width={100} color='var(--color-accent)'/>
                <h1 className='logo-text'>Invest Portfolio</h1>
            </div>
            <ThemeToggle />
        </header>
    )
}

export default Header;