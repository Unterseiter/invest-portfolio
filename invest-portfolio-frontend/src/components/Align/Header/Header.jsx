import './Header.css';
import '../../common/buttons/Buttons.css';
import Logo from '../../../assets/header/Logo';
import Sun from '../../../assets/header/Sun';

function Header() {
    return(
        <header className="Header">
            <div className='logo'>
                <Logo width={100} />
                <h1 className='logo-text'>Invest Portfolio</h1>
            </div>
            <button className='Theme-toggle-button'>
                <Sun width={35} color='#ffff' />
            </button>
        </header>
    )
}
export default Header;