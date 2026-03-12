import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Package, ShoppingCart, History, 
    Truck, MessageSquare, Bell, User, LogOut, Menu, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();
    
    const menuItems = [
        { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/request', name: 'Request Ration', icon: <ShoppingCart size={20} /> },
        { path: '/history', name: 'Purchase History', icon: <History size={20} /> },
        { path: '/delivery', name: 'Delivery Request', icon: <Truck size={20} /> },
        { path: '/donate', name: 'Donate / Skip Ration', icon: <Package size={20} /> },
        { path: '/complaints', name: 'Complaints', icon: <MessageSquare size={20} /> },
        { path: '/notifications', name: 'Notifications', icon: <Bell size={20} /> },
        { path: '/profile', name: 'Profile Settings', icon: <User size={20} /> },
    ];

    return (
        <aside className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo-section">
                    <span className="logo-icon">SRMS</span>
                    <span className="logo-text">Citizen Portal</span>
                </div>
                <button className="mobile-close" onClick={toggleSidebar}>
                    <X size={24} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink 
                                to={item.path} 
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={logout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
