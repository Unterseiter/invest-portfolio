import './Buttons.css';
import Sun from '../../../assets/header/Sun';
import Moon from '../../../assets/header/Moon';
import { useTheme } from '../../../contexts/ThemeContext';
// import { useState, useEffect } from 'react';


const ThemeToggle = () => {
    const { currentTheme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme} className='Theme-toggle-button'>
                {currentTheme ==='light'? (
                    <Sun width={35} color='var(--color-primary)' />
                ):(
                    <Moon width={35} color='var(--color-primary)'/>
                )}
            </button>
    );
};

export default ThemeToggle;