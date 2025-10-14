import './Header.css';
import '../../common/Buttons.css';
import Logo from '../../../assets/header/Logo';
import Sun from '../../../assets/header/Sun';

function Header() {
    return(
        <header className="Header">
            <div className='logo'>
                <Logo width={120} />
                <h1>Invest Portfolio</h1>
            </div>
            <button className='Theme-toggle-button'>
                <Sun width={35}/>
            </button>
        </header>
    )
}
export default Header;