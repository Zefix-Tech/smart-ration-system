import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MapPin, Store, Shield, Save, Key, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const Profile = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('srms_user_token');
                const res = await axios.get('http://localhost:5001/api/user-portal/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data);
            } catch (err) {
                console.error('Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage('');
        try {
            const token = localStorage.getItem('srms_user_token');
            // Update text fields
            await axios.patch('http://localhost:5001/api/user-portal/profile', profile, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Profile updated successfully!');
        } catch (err) {
            setMessage('Update failed. Try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return setMessage('New passwords do not match');
        }
        setUpdating(true);
        try {
            const token = localStorage.getItem('srms_user_token');
            await axios.patch('http://localhost:5001/api/user-portal/password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Password updated successfully!');
            setShowPasswordModal(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            setMessage(err.response?.data?.message || 'Password update failed');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;
    if (!profile) return <div className="error-state">Failed to load profile. Please refresh or login again.</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2><User size={24} /> Profile Settings</h2>
                <p>Manage your account security and personal information</p>
            </header>

            {message && <div className={`alert ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

            <div className="dashboard-grid">
                <section className="dashboard-section">
                    <div className="section-header">
                        <h3>Personal Information</h3>
                    </div>
                    <form onSubmit={handleUpdate}>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Full Name</label>
                                <input type="text" value={profile?.name || ''} disabled={true} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Mobile Number</label>
                                <input type="tel" value={profile?.phone || ''} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                            </div>
                            <div className="form-group flex-1">
                                <label>Aadhaar Number</label>
                                <input type="text" value={profile?.aadhaar || ''} disabled />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Ration Card Number</label>
                            <input type="text" value={profile?.rationCard || ''} disabled />
                        </div>

                        <div className="section-header" style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', paddingBottom: '5px', borderBottom: '1px solid #eef2f6' }}>Contact Location</h3>
                        </div>

                        <div className="form-group">
                            <label>Home Address</label>
                            <textarea value={profile?.address || ''} onChange={(e) => setProfile({...profile, address: e.target.value})} rows="3"></textarea>
                        </div>
                        <button type="submit" className="submit-btn" disabled={updating}>
                            {updating ? 'Saving...' : <><Save size={18} /> Update Profile</>}
                        </button>
                    </form>
                </section>

                <section className="dashboard-section side-section">
                    <div className="section-header">
                        <h3>Affiliated Shop</h3>
                    </div>
                    <div className="shop-info-card">
                        <div className="shop-icon-box"><Store size={32} /></div>
                        <h4>{profile?.shopId?.name || 'Assigned Ration Shop'}</h4>
                        <p className="shop-desc">{profile?.shopId?.address || 'Location not available'}</p>
                        <div className="shop-meta">
                            <span><MapPin size={14} /> {profile?.cityId || 'N/A'}</span>
                            <span><Shield size={14} /> Registered</span>
                        </div>
                    </div>

                    <div className="security-section">
                        <h4>Security</h4>
                        <button 
                            className="auth-btn secondary" 
                            style={{ margin: 0, padding: '0.6rem' }}
                            onClick={() => setShowPasswordModal(true)}
                        >
                            <Key size={16} /> Change Password
                        </button>
                    </div>
                </section>
            </div>

            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Change Password</h3>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.current} 
                                    onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.new} 
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.confirm} 
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={updating}>Update Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .form-row { display: flex; gap: 1.5rem; }
                .flex-1 { flex: 1; }
                .shop-info-card { 
                    background: #f8fbff; 
                    padding: 1.5rem; 
                    border-radius: 12px; 
                    text-align: center;
                    border: 1px solid #eef2f6;
                    margin-bottom: 2rem;
                }
                .shop-icon-box { 
                    width: 60px; height: 60px; 
                    background: white; border-radius: 50%; 
                    margin: 0 auto 1rem; 
                    display: flex; align-items: center; justify-content: center;
                    color: var(--primary-color);
                    box-shadow: var(--card-shadow);
                }
                .shop-desc { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }
                .shop-meta { display: flex; justify-content: center; gap: 15px; font-size: 0.8rem; color: #888; }
                .shop-meta span { display: flex; align-items: center; gap: 4px; }
                .security-section { padding-top: 1.5rem; border-top: 1px solid #eee; }
                .security-section h4 { margin-bottom: 1rem; color: #444; }
                
                @media (max-width: 600px) {
                    .form-row { flex-direction: column; gap: 0; }
                }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white; padding: 2rem; border-radius: 12px; width: 400px;
                    max-width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
                .btn-cancel { 
                    flex: 1; padding: 0.8rem; border-radius: 8px; border: 1px solid #ddd;
                    background: #eee; cursor: pointer;
                }
                .modal-content h3 { margin-bottom: 1.5rem; color: var(--text-dark); }
            `}</style>
        </div>
    );
};

export default Profile;
