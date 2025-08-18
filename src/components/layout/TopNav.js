import React, { useState, useEffect } from 'react';
import MessageBox from './MessageBox';
import UserDropdown from './UserDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import '../../styles/TopNav.css';

const TopNav = ({ 
  toggleSidebar, 
  toggleMessageBox, 
  toggleUserDropdown, 
  toggleNotificationsDropdown, 
  user 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Debug: Log user data
  useEffect(() => {
    console.log('TopNav - User data:', user);
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // TODO: Implement actual search functionality
      // You can add search logic here or emit an event
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'RH';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleNotificationClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Notification button clicked');
    setShowNotificationsDropdown(!showNotificationsDropdown);
    setShowUserDropdown(false);
    setShowMessageBox(false);
  };

  const handleMessageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Message button clicked');
    setShowMessageBox(!showMessageBox);
    setShowUserDropdown(false);
    setShowNotificationsDropdown(false);
  };

  const handleUserProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('User profile clicked');
    setShowUserDropdown(!showUserDropdown);
    setShowMessageBox(false);
    setShowNotificationsDropdown(false);
  };

  const handleSidebarToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Sidebar toggle clicked');
    toggleSidebar();
  };

  // Get user display info with fallbacks
  const userName = user?.name || user?.nom || user?.prenom || 'Admin RH';
  const userRole = user?.role || user?.poste || user?.fonction || 'Administration';
  const userEmail = user?.email || 'admin@centre-diagnostic.com';

  return (
    <div className="top-nav-container">
      <nav className="top-nav">
        <button 
          className="toggle-sidebar" 
          onClick={handleSidebarToggle}
          title="Basculer la barre latérale"
        >
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="top-nav-search">
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              className={`search-input ${isSearchFocused ? 'focused' : ''}`}
              placeholder="Rechercher un employé, un contrat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            <button type="submit" className="search-submit" title="Rechercher">
              <i className="fas fa-search search-icon"></i>
            </button>
          </form>
        </div>
        
        <div className="top-nav-actions">
          <button 
            className="nav-action-btn notification-btn" 
            id="notificationBtn"
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <i className="fas fa-bell"></i>
            <span className="badge-pill">3</span>
          </button>
          
          <button 
            className="nav-action-btn message-btn" 
            id="messageBtn"
            onClick={handleMessageClick}
            title="Messages"
          >
            <i className="fas fa-comments"></i>
            <span className="badge-pill">5</span>
          </button>
          
          <div 
            className="user-profile" 
            id="userProfile" 
            onClick={handleUserProfileClick}
            title="Menu utilisateur"
          >
            <div className="user-avatar">
              {getInitials(userName)}
            </div>
            <div className="user-info">
              <div className="user-name">
                {userName}
              </div>
              <div className="user-title">
                {userRole}
              </div>
            </div>
            <i className="fas fa-chevron-down user-dropdown-arrow"></i>
          </div>
        </div>
      </nav>

      {/* Dropdowns positioned relative to TopNav */}
      {showNotificationsDropdown && (
        <NotificationsDropdown />
      )}
      
      {showUserDropdown && (
        <UserDropdown 
          user={user}
          onLogout={() => {
            // Handle logout if needed
            console.log('Logout clicked');
          }}
        />
      )}
      
      {showMessageBox && (
        <MessageBox 
          gmailAuthenticated={true}
          gmailEmails={[]}
          onClose={() => setShowMessageBox(false)}
        />
      )}
    </div>
  );
};

export default TopNav;