import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/EmployeePortal.css';

const EmployeeTopNav = ({ toggleSidebar, employee }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('employeeUser');
    // Redirect to login page
    navigate('/employee-login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="top-nav">
      <button className="toggle-sidebar" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      
      <div className="top-nav-search">
        <form onSubmit={handleSearch}>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search search-icon"></i>
        </form>
      </div>
      
      <div className="top-nav-actions">
        <div className="dropdown">
          <button 
            className="nav-action-btn notification-btn" 
            id="notificationBtn"
            onClick={() => {
              setShowNotificationsDropdown(!showNotificationsDropdown);
              setShowMessagesDropdown(false);
            }}
          >
            <i className="fas fa-bell"></i>
            <span className="badge-pill">2</span>
          </button>
          
          {showNotificationsDropdown && (
            <div className="dropdown-menu dropdown-menu-end shadow notification-dropdown p-0 show">
              <div className="p-3 bg-primary text-white">
                <h6 className="mb-0">Notifications</h6>
              </div>
              
              <div className="p-2">
                <a href="#" className="dropdown-item p-2 border-bottom d-flex align-items-center">
                  <div className="me-3 bg-success-light text-success rounded-circle p-2">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div>
                    <p className="mb-0 fw-medium">Votre demande de congés a été approuvée</p>
                    <p className="small text-muted mb-0">Il y a 30 minutes</p>
                  </div>
                </a>
                <a href="#" className="dropdown-item p-2 border-bottom d-flex align-items-center">
                  <div className="me-3 bg-info-light text-info rounded-circle p-2">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div>
                    <p className="mb-0 fw-medium">Nouveau bulletin de salaire disponible</p>
                    <p className="small text-muted mb-0">Il y a 2 heures</p>
                  </div>
                </a>
              </div>
              
              <div className="p-2 border-top">
                <a href="#" className="dropdown-item text-center small text-primary p-2">
                  Voir toutes les notifications
                </a>
              </div>
            </div>
          )}
        </div>
        
        <div className="dropdown">
          <button 
            className="nav-action-btn message-btn" 
            id="messageBtn"
            onClick={() => {
              setShowMessagesDropdown(!showMessagesDropdown);
              setShowNotificationsDropdown(false);
            }}
          >
            <i className="fas fa-comments"></i>
            <span className="badge-pill">1</span>
          </button>
          
          {showMessagesDropdown && (
            <div className="dropdown-menu dropdown-menu-end shadow p-0 show" style={{ width: '320px' }}>
              <div className="p-3 bg-info text-white">
                <h6 className="mb-0">Messages</h6>
              </div>
              
              <div className="p-2">
                <a href="#" className="dropdown-item p-2 border-bottom d-flex align-items-center">
                  <div className="me-3">
                    <div className="avatar bg-light-info text-info rounded-circle">RH</div>
                  </div>
                  <div>
                    <p className="mb-0 fw-medium">Service RH</p>
                    <p className="small text-muted mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                      Bonjour, votre document est disponible au service RH
                    </p>
                    <p className="small text-muted mb-0">Il y a 1 heure</p>
                  </div>
                </a>
              </div>
              
              <div className="p-2 border-top">
                <a href="#" className="dropdown-item text-center small text-primary p-2">
                  Voir tous les messages
                </a>
              </div>
            </div>
          )}
        </div>
        
        <div className="dropdown">
          <div 
            className="user-profile" 
            id="userProfile" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <div className="user-avatar">{getInitials(employee?.nom_prenom)}</div>
            <div className="user-info">
              <div className="user-name">{employee?.nom_prenom || 'Utilisateur'}</div>
              <div className="user-title">{employee?.poste_actuel || 'Employé'}</div>
            </div>
            <i className="fas fa-chevron-down ms-2 small"></i>
          </div>
          
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="userProfile">
            <li>
              <div className="dropdown-item-text py-2">
                <div className="fw-bold">{employee?.nom_prenom || 'Utilisateur'}</div>
                <div className="text-muted small">{employee?.email || ''}</div>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item" href="#"><i className="fas fa-user-circle me-2"></i>Mon profil</a></li>
            <li><a className="dropdown-item" href="#"><i className="fas fa-cog me-2"></i>Paramètres</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>Déconnexion
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default EmployeeTopNav;