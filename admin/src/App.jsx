import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
// ... rest remains same ...
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Shops from './pages/Shops';
import Stock from './pages/Stock';
import Delivery from './pages/Delivery';
import Eligibility from './pages/Eligibility';
import Complaints from './pages/Complaints';
import Fraud from './pages/Fraud';
import Predictions from './pages/Predictions';
import Donations from './pages/Donations';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import MapView from './pages/MapView';

const ProtectedRoute = ({ children }) => {
    const { admin, loading } = useAuth();
    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium tracking-wide">Loading System...</div>;
    
    // Check if logged in AND is super admin
    if (!admin) return <Navigate to="/login" replace />;
    if (admin.role !== 'superadmin') return <div className="h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold p-10 text-center">Access Denied: Only Super Admin can access this dashboard.</div>;
    
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/shops" element={<Shops />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/eligibility" element={<Eligibility />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/complaints" element={<Complaints />} />
                <Route path="/fraud" element={<Fraud />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/donations" element={<Donations />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/audit" element={<AuditLogs />} />
                {/* other routes will map here */}
                <Route path="*" element={<div className="p-10 text-center text-gray-500 text-lg">Page under construction</div>} />
            </Route>
        </Routes>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="top-right" />
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
};

export default App;
