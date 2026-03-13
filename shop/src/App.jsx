import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Purchases from './pages/Purchases';
import Delivery from './pages/Delivery';
import Complaints from './pages/Complaints';
import Distribution from './pages/Distribution';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import DeliveryTeam from './pages/DeliveryTeam';

const ProtectedRoute = ({ children }) => {
    const { admin, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium tracking-wide">Initializing Shop Portal...</div>;

    if (!admin) return <Navigate to="/login" replace />;

    // Allow both shop admins and delivery persons
    if (!['shopadmin', 'deliveryman'].includes(admin.role)) return <Navigate to="/login" replace />;

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
                <Route path="/stock" element={<Stock />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/delivery-team" element={<DeliveryTeam />} />
                <Route path="/complaints" element={<Complaints />} />
                <Route path="/distribution" element={<Distribution />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<div className="p-10 text-center text-gray-500 text-lg">Shop Feature Under Construction</div>} />
            </Route>
        </Routes>
    );
};

import { Toaster } from 'react-hot-toast';

const App = () => {
    return (
        <AuthProvider>
            <Toaster position="top-right" reverseOrder={false} />
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
};

export default App;
