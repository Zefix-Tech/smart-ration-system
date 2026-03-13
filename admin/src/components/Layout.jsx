import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import '../styles/layout.css';

const Layout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className={`layout-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Overlay for mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
            
            <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
            
            <div className="layout-main-column">
                <TopBar toggleSidebar={toggleSidebar} />
                <main className="layout-content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
