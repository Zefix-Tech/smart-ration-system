import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Store, Package, Truck, 
    MessageSquare, ShieldAlert, BrainCircuit, HeartHandshake, 
    Bell, FileText, LogOut, History, Map, ClipboardCheck 
} from 'lucide-react';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const navItems = [
        { path: '/', name: 'Dashboard Overview', icon: <LayoutDashboard /> },
        { path: '/users', name: 'User Management', icon: <Users /> },
        { path: '/shops', name: 'Ration Shop Management', icon: <Store /> },
        { path: '/stock', name: 'Stock Monitoring', icon: <Package /> },
        { path: '/eligibility', name: 'Eligibility Verification', icon: <ClipboardCheck /> },
        { path: '/delivery', name: 'Delivery Requests', icon: <Truck /> },
        { path: '/complaints', name: 'Complaint Management', icon: <MessageSquare /> },
        { path: '/fraud', name: 'Fraud Detection', icon: <ShieldAlert /> },
        { path: '/predictions', name: 'AI Stock Prediction', icon: <BrainCircuit /> },
        { path: '/donations', name: 'Donation Management', icon: <HeartHandshake /> },
        { path: '/notifications', name: 'Communications', icon: <Bell /> },
        { path: '/reports', name: 'Reports & Analytics', icon: <FileText /> },
        { path: '/map', name: 'Ration Shop Map', icon: <Map /> },
        { path: '/audit', name: 'System Audit Logs', icon: <History /> },
    ];

    return (
        <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <h1 className="sidebar-logo">Smart Ration<br /><span className="sidebar-logo-highlight">Admin</span></h1>
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
                &copy; 2026 SRMS Gov
            </div>
        </div>
    );
};

export default Sidebar;
