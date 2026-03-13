import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/topbar.css';

const TopBar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                const token = sessionStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/user-portal/notifications', {
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

        if (user) {
            fetchNotificationCount();
            const intervalId = setInterval(fetchNotificationCount, 30000); // Poll every 30s
            return () => clearInterval(intervalId);
        }
    }, [user]);

    return (
        <header className="topbar-container">
            <div className="topbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search services..." />
                </div>
            </div>

            <div className="topbar-right">
                <button className="icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
                    <Bell size={20} />
                    {notifCount > 0 && <span className="badge">{notifCount}</span>}
                </button>
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'Citizen'}</span>
                        <span className="user-role">Ration Card: {user?.rationCard}</span>
                    </div>
                    <div className="user-avatar">
                        <User size={24} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
