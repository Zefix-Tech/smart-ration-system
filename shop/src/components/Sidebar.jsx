import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, Truck,
    MessageSquare, ClipboardList, Bell, FileText,
    Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const { admin } = useAuth();
    const isAdmin = admin?.role === 'shop_owner';
    const isDelivery = admin?.role === 'delivery_person';

    // Full menu for shop admin
    const adminNavItems = [
        { path: '/shop-dashboard', name: 'Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/stock', name: 'Stock Management', icon: <Package size={20} /> },
        { path: '/purchases', name: 'Purchase Requests', icon: <ShoppingCart size={20} /> },
        { path: '/citizens', name: 'Citizens', icon: <Users size={20} /> },
        { path: '/delivery-requests', name: 'Delivery Requests', icon: <Truck size={20} /> },
        { path: '/delivery-team', name: 'Delivery Team', icon: <Users size={20} /> },
        { path: '/distribution', name: 'Distribution Records', icon: <ClipboardList size={20} /> },
        { path: '/complaints', name: 'Complaints', icon: <MessageSquare size={20} /> },
        { path: '/notifications', name: 'Notifications', icon: <Bell size={20} /> },
        { path: '/reports', name: 'Reports', icon: <FileText size={20} /> },
    ];

    // Restricted menu for delivery persons
    const deliveryNavItems = [
        { path: '/delivery-requests', name: 'Delivery Requests', icon: <Truck size={20} /> },
    ];

    const navItems = isDelivery ? deliveryNavItems : adminNavItems;

    return (
        <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <h1 className="sidebar-logo">SRMS<br /><span className="sidebar-logo-sub">
                    {isDelivery ? 'Delivery Portal' : 'Shop Portal'}
                </span></h1>
                {isDelivery && (
                    <div style={{ marginTop: '0.5rem', background: '#fef9c3', color: '#854d0e', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                        DELIVERY PERSON
                    </div>
                )}
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
                                end={item.path === '/shop-dashboard'}
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
