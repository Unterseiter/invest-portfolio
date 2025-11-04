import './Buttons.css';
import Sun from '../../../assets/header/Sun';
import Moon from '../../../assets/header/Moon';
import { useTheme } from '../../../contexts/ThemeContext';

const ThemeToggle = () => {
    const { currentTheme, toggleTheme } = useTheme();

    return (
        <button 
            onClick={toggleTheme} 
            className='Theme-toggle-button'
            aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
        >
            {currentTheme === 'light' ? (
                <Sun width={24} color='currentColor' />
            ) : (
                <Moon width={24} color='currentColor' />
            )}
        </button>
    );
};

export default ThemeToggle;