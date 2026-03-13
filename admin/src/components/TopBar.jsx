import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, Bell, LogOut, User, Menu } from 'lucide-react';
import '../styles/topbar.css';

const TopBar = ({ toggleSidebar }) => {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                const token = sessionStorage.getItem('srms_token');
                const res = await axios.get('http://localhost:5001/api/notifications', {
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

        fetchNotificationCount();
        const intervalId = setInterval(fetchNotificationCount, 30000); // Poll every 30s
        return () => clearInterval(intervalId);
    }, []);

    const handleNotificationsClick = () => {
        navigate('/notifications');
    };

    return (
        <header className="topbar-header">
            <div className="topbar-left">
                <button className="menu-toggle-btn" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="search-container">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search everywhere..."
                        className="search-input"
                    />
                </div>
            </div>

            <div className="topbar-actions">
                <button 
                    className="notification-btn"
                    onClick={handleNotificationsClick}
                    title="View Notifications"
                >
                    <Bell className="notification-icon" />
                    {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
                </button>

                <div className="divider"></div>

                <div className="profile-section">
                    <div className="profile-info">
                        <p className="profile-name">{admin?.name}</p>
                        <p className="profile-role">{admin?.role}</p>
                    </div>
                    <div className="avatar">
                        <User className="avatar-icon" />
                    </div>
                    <button
                        onClick={logout}
                        className="logout-btn"
                        title="Logout"
                    >
                        <LogOut className="logout-icon" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
