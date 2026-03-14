import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Phone, Lock, RefreshCw, UserCheck } from 'lucide-react';
import '../styles/login-gov.css';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [captchaVal, setCaptchaVal] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { user, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

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
            const success = await login(phone, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid phone number or password');
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
                    <div className="icon-box">
                        <UserCheck size={32} />
                    </div>
                    <h2>Citizen Login</h2>
                    <p>Enter your credentials to access the citizen ration portal.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-alert">{error}</div>}

                    <div className="form-group-gov">
                        <label className="label-gov">Registered Mobile Number</label>
                        <div className="input-wrapper">
                            <Phone size={18} />
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="input-gov"
                                placeholder="9876543210"
                            />
                        </div>
                    </div>

                    <div className="form-group-gov">
                        <label className="label-gov">Secure Password</label>
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
                        {loading ? 'Verifying...' : 'Secure Login'}
                    </button>
                </form>

                <div className="auth-footer-gov">
                    <p>Don't have an account? <Link to="/register" className="auth-link-gov">Register Now</Link></p>
                </div>

                <div className="security-notice">
                    Authorized citizens only. Sessions are monitored for security compliance.
                </div>
            </div>

            <footer className="login-footer-main">
                &copy; 2026 Government of India – Smart Ration Management System
            </footer>
        </div>
    );
};

export default Login;
