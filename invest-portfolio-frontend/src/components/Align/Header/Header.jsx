import React from 'react';
import './Header.css';
import Logo from '../../../assets/header/Logo';
import ThemeToggle from '../../common/buttons/ThemeToggle';
import BurgerMenu from '../../common/buttons/BurgerMenu';

function Header({ isSidebarOpen, onToggleSidebar }) {
    const [screenSize, setScreenSize] = React.useState('desktop');

    // Определяем тип устройства
    React.useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width <= 768) {
                setScreenSize('mobile');
            } else if (width <= 1024) {
                setScreenSize('tablet');
            } else {
                setScreenSize('desktop');
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    // Показываем бургер только на мобильных и планшетах
    const showBurger = screenSize === 'mobile' || screenSize === 'tablet';

    return (
        <header className="header" role="banner">
            <div className="header__container">
                <div className="header__left">
                    {/* Показываем бургер только на мобильных и планшетах */}
                    {showBurger && (
                        <BurgerMenu 
                            isOpen={isSidebarOpen}
                            onToggle={onToggleSidebar}
                            className="header__burger"
                        />
                    )}
                    <div className="header__logo">
                        <Logo 
                            width={100} 
                            height={100}
                            color="var(--color-accent)" 
                        />
                        <h1 className="header__title">AI assistent trader </h1>
                    </div>
                </div>
                
                <div className="header__actions">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

export default React.memo(Header);