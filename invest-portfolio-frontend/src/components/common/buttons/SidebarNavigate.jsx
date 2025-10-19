import './Buttons.css';
import { useNavigate } from 'react-router-dom';

const SidebarNavigate = ({text = "SidebarNavigate Text", path = "/"}) => {

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(path);
    }

    return(
        <button className='Sidebar-navigate' onClick={handleClick}>
            <p>
                {text}
            </p>
        </button>
    );

};

export default SidebarNavigate;