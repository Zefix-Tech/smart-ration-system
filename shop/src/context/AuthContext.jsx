import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5001/api';

    useEffect(() => {
        const token = sessionStorage.getItem('srms_shop_token');
        const storedAdmin = sessionStorage.getItem('srms_admin_data');
        if (storedAdmin) {
            setAdmin(JSON.parse(storedAdmin));
        }
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/shop/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (['shop_owner', 'delivery_person'].includes(res.data.role)) {
                setAdmin(res.data);
                sessionStorage.setItem('srms_admin_data', JSON.stringify(res.data));
            } else {
                sessionStorage.removeItem('srms_shop_token');
            }
        } catch (err) {
            sessionStorage.removeItem('srms_shop_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL.replace('/api', '/api/shop')}/login`, { email, password });
        if (['shop_owner', 'delivery_person'].includes(res.data.admin.role)) {
            sessionStorage.setItem('srms_shop_token', res.data.token);
            sessionStorage.setItem('srms_admin_data', JSON.stringify(res.data.admin));
            setAdmin(res.data.admin);
            return res.data.admin; // Return admin for redirection logic in Login.jsx
        } else {
            throw new Error('Access Denied: Not a Shop Admin or Delivery Person');
        }
    };

    const logout = () => {
        sessionStorage.removeItem('srms_shop_token');
        sessionStorage.removeItem('srms_admin_data');
        setAdmin(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ admin, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
