import './Sidebar.css';
import SidebarNavigate from '../../common/buttons/SidebarNavigate';

function Sidebar (){
return(
    <aside className='Sidebar'>
        <SidebarNavigate text='Главная' path='/'/>
        <SidebarNavigate text='Настройки' path='/settings'/>
        <SidebarNavigate text='Активы' path='/monitoring'/>
        <SidebarNavigate text='Расчёт' path='/functional'/>
    </aside>
)
}
export default Sidebar;