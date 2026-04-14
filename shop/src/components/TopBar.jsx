import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, Bell } from 'lucide-react';
import '../styles/topbar.css';

const TopBar = ({ toggleSidebar }) => {
    const { admin, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [notifCount, setNotifCount] = useState(0);

    const fetchNotificationCount = async () => {
        try {
            const token = sessionStorage.getItem('srms_shop_token');
            const res = await axios.get('/api/shop/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && Array.isArray(res.data)) {
                const unreadCount = res.data.filter(n => !n.isRead).length;
                setNotifCount(unreadCount);
            }
        } catch (err) {
            console.error('Failed to fetch notification count');
        }
    };

    useEffect(() => {
        if (admin && !loading) {
            fetchNotificationCount();
            const intervalId = setInterval(fetchNotificationCount, 30000);
            return () => clearInterval(intervalId);
        }
    }, [admin, loading]);

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
                <button 
                    className="notification-btn" 
                    title="View Notifications"
                    onClick={() => navigate('/notifications')}
                >
                    <Bell size={20} color="#64748b" />
                    {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
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
