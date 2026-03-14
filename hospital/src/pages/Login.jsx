import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Hospital, Mail, Lock, Key, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hospitalId, setHospitalId] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login(email, password, hospitalId);
            if (success) {
                toast.success('Welcome to Hospital Verification Portal');
                navigate('/');
            } else {
                toast.error('Invalid credentials');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                        <Hospital size={32} color="#fff" />
                    </div>
                    <h1>SRMS Hospital Portal</h1>
                    <p>Medical Certificate Verification System</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label><Key size={16} /> Hospital ID</label>
                        <input 
                            type="text" 
                            placeholder="e.g. HOSP001" 
                            value={hospitalId} 
                            onChange={(e) => setHospitalId(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label><Mail size={16} /> Hospital Email</label>
                        <input 
                            type="email" 
                            placeholder="hospital@srms.gov.in" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label><Lock size={16} /> Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><ShieldCheck size={20} /> Secure Login</span>}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 Smart Ration Management System</p>
                    <p>Department of Food and Civil Supplies</p>
                </div>
            </div>

            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                .login-card {
                    background: white;
                    padding: 2.5rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    width: 100%;
                    max-width: 420px;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .logo-icon {
                    background: #0284c7;
                    width: 64px;
                    height: 64px;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }
                .login-header h1 {
                    font-size: 1.5rem;
                    color: #0c4a6e;
                    margin-bottom: 0.5rem;
                }
                .login-header p {
                    color: #64748b;
                    font-size: 0.875rem;
                }
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .form-group label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #334155;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .form-group input {
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .form-group input:focus {
                    border-color: #0284c7;
                    box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1);
                }
                .login-btn {
                    background: #0284c7;
                    color: white;
                    padding: 0.875rem;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-top: 0.5rem;
                }
                .login-btn:hover {
                    background: #0369a1;
                }
                .login-btn:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }
                .login-footer {
                    margin-top: 2rem;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.75rem;
                }
            `}</style>
        </div>
    );
};

export default Login;
