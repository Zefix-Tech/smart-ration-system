import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Package, ShoppingCart, Truck, 
    MessageSquare, ClipboardList, Bell, FileText, 
    LogOut 
} from 'lucide-react';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const navItems = [
        { path: '/', name: 'Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/stock', name: 'Stock Management', icon: <Package size={20} /> },
        { path: '/purchases', name: 'Purchase Requests', icon: <ShoppingCart size={20} /> },
        { path: '/delivery', name: 'Delivery Requests', icon: <Truck size={20} /> },
        { path: '/distribution', name: 'Distribution Records', icon: <ClipboardList size={20} /> },
        { path: '/complaints', name: 'Complaints', icon: <MessageSquare size={20} /> },
        { path: '/notifications', name: 'Notifications', icon: <Bell size={20} /> },
        { path: '/reports', name: 'Reports', icon: <FileText size={20} /> },
    ];

    return (
        <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <h1 className="sidebar-logo">SRMS<br /><span className="sidebar-logo-sub">Shop Portal</span></h1>
            </div>
            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                <span className="sidebar-text">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                &copy; 2026 Smart Ration
            </div>
        </div>
    );
};

export default Sidebar;
