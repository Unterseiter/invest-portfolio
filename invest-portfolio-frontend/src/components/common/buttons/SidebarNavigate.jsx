import './Buttons.css';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarNavigate = ({ text = "SidebarNavigate Text", path = "/", icon = null }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = () => {
        navigate(path);
    }

    const isActive = location.pathname === path;

    return(
        <button 
            className={`Sidebar-navigate ${isActive ? 'active' : ''}`} 
            onClick={handleClick}
        >
            {icon && <span className="button-icon">{icon}</span>}
            <p>{text}</p>
        </button>
    );
};

export default SidebarNavigate;