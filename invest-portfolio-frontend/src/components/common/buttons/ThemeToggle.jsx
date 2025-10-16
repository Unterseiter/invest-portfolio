import './Buttons.css';
import { useState, useEffect } from 'react';


const ThemeToggle = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <button onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Темная' : '☀️ Светлая'}
        </button>
    );
};

export default ThemeToggle;