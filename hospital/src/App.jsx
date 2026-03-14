import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
    const { hospital, loading } = useAuth();
    if (loading) return <div className="h-screen flex items-center justify-center bg-sky-50 text-sky-600 font-bold">Checking Credentials...</div>;
    if (!hospital) return <Navigate to="/login" replace />;
    return children;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
            <style>{`
                body { margin: 0; padding: 0; }
                .h-screen { height: 100vh; }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .justify-center { justify-content: center; }
                .bg-sky-50 { background-color: #f0f9ff; }
                .text-sky-600 { color: #0284c7; }
                .font-bold { font-weight: 700; }
            `}</style>
        </AuthProvider>
    );
};

export default App;
