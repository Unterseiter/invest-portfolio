import './Sidebar.css';
import SidebarNavigate from '../../common/buttons/SidebarNavigate';

function Sidebar (){
return(
    <aside className='Sidebar'>
        <SidebarNavigate text='Главная'/>
        <SidebarNavigate text='Настройки'/>
        <SidebarNavigate text='Активы'/>
        <SidebarNavigate text='Расчёт'/>
    </aside>
)
}
export default Sidebar;