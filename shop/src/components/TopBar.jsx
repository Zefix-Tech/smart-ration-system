import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, Bell } from 'lucide-react';
import '../styles/topbar.css';

const TopBar = ({ toggleSidebar }) => {
    const { admin, logout } = useAuth();

    return (
        <header className="topbar-header">
            <div className="topbar-left">
                <button className="menu-toggle-btn" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="shop-info-badge">
                    Shop ID: {admin?.shop?.shopId || 'S-12345'}
                </div>
            </div>

            <div className="topbar-actions">
                <button className="icon-btn">
                    <Bell size={20} color="#64748b" />
                </button>
                
                <div className="profile-section">
                    <div className="avatar">
                        <User size={20} />
                    </div>
                    <button onClick={logout} className="logout-btn" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
