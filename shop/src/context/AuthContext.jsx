import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5001/api';

    useEffect(() => {
        const token = localStorage.getItem('srms_shop_token');
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/admin/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.role === 'shopadmin') {
                setAdmin(res.data);
            } else {
                localStorage.removeItem('srms_shop_token');
            }
        } catch (err) {
            localStorage.removeItem('srms_shop_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/admin/login`, { email, password });
        if (res.data.admin.role === 'shopadmin') {
            localStorage.setItem('srms_shop_token', res.data.token);
            setAdmin(res.data.admin);
            return true;
        } else {
            throw new Error('Access Denied: Not a Shop Admin');
        }
    };

    const logout = () => {
        localStorage.removeItem('srms_shop_token');
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
