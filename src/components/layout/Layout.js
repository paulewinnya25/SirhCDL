import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import '../../styles/Layout.css';

const Layout = ({ user, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Debug: Log user data
  useEffect(() => {
    console.log('Layout - User data:', user);
  }, [user]);

  useEffect(() => {
    // Handle responsive sidebar
    const handleResponsive = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResponsive();
    window.addEventListener('resize', handleResponsive);

    return () => {
      window.removeEventListener('resize', handleResponsive);
    };
  }, []);

  const toggleSidebar = () => {
    console.log('Layout - Toggling sidebar');
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Mock functions for TopNav (these will be handled internally now)
  const toggleMessageBox = () => {
    console.log('Layout - Message box toggle (handled by TopNav)');
  };

  const toggleUserDropdown = () => {
    console.log('Layout - User dropdown toggle (handled by TopNav)');
  };

  const toggleNotificationsDropdown = () => {
    console.log('Layout - Notifications dropdown toggle (handled by TopNav)');
  };

  return (
    <div className="layout-container">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        currentPath={location.pathname}
      />
      
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <TopNav 
          toggleSidebar={toggleSidebar}
          toggleMessageBox={toggleMessageBox}
          toggleUserDropdown={toggleUserDropdown}
          toggleNotificationsDropdown={toggleNotificationsDropdown}
          user={user}
        />
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;