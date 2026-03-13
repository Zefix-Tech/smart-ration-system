import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, RefreshCw } from 'lucide-react';
import '../styles/login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [captchaVal, setCaptchaVal] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { admin, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (admin) {
            if (admin.role === 'shop_owner') navigate('/shop-dashboard');
            else if (admin.role === 'delivery_person') navigate('/delivery-requests');
            else navigate('/');
        }
    }, [admin, navigate]);

    const refreshCaptcha = () => {
        setCaptchaVal(Math.random().toString(36).substring(2, 8).toUpperCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (captcha.toUpperCase() !== captchaVal) {
            setError('Invalid CAPTCHA code');
            return;
        }

        setLoading(true);
        try {
            const admin = await login(email, password);
            if (admin) {
                if (admin.role === 'shop_owner') navigate('/shop-dashboard');
                else if (admin.role === 'delivery_person') navigate('/delivery-requests');
                else navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="gov-branding">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                    alt="Emblem of India"
                    className="gov-emblem"
                />
                <div className="gov-text">
                    <p className="gov-title">Government of India</p>
                    <p className="gov-dept">Smart Ration Management Portal</p>
                </div>
            </div>

            <div className="login-card">
                <div className="card-header">
                    <ShieldCheck size={32} color="#2563eb" />
                    <h2>Shop Admin Login</h2>
                    <p>Enter credentials to access the shop dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-alert">{error}</div>}

                    <div className="form-group-gov">
                        <label className="label-gov">Administrator Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-gov"
                                placeholder="admin@shop.gov.in"
                            />
                        </div>
                    </div>

                    <div className="form-group-gov">
                        <label className="label-gov">Security Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-gov"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="form-group-gov">
                        <label className="label-gov">CAPTCHA Verification</label>
                        <div className="captcha-row">
                            <div className="captcha-display">{captchaVal}</div>
                            <button type="button" onClick={refreshCaptcha} className="refresh-btn">
                                <RefreshCw size={18} />
                            </button>
                            <input
                                type="text"
                                required
                                value={captcha}
                                onChange={e => setCaptcha(e.target.value)}
                                className="input-gov"
                                style={{ flex: 1 }}
                                placeholder="Code"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-login-gov">
                        {loading ? 'Verifying...' : 'Secure Authorization'}
                    </button>
                </form>

                <div className="security-notice">
                    Authorized personnel only. Sessions are monitored for security compliance.
                </div>
            </div>

            <footer className="login-footer">
                &copy; 2026 Government of India – Smart Ration Management System
            </footer>
        </div>
    );
};

export default Login;
