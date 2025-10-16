import './Buttons.css';
import { useState, useEffect } from 'react';

const SidebarNavigate = ({text = "SidebarNavigate Text"}) => {

    return(
        <button className='Sidebar-navigate'>
            <p>
                {text}
            </p>
        </button>
    );

};

export default SidebarNavigate;