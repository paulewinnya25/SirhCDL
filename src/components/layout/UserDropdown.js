import React from 'react';

const UserDropdown = ({ user, onLogout }) => {
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'RH';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.name || user?.nom || user?.prenom || 'Admin RH';
  const userRole = user?.role || user?.poste || user?.fonction || 'Administration';
  const userEmail = user?.email || 'admin@centre-diagnostic.com';

  return (
    <div className="dropdown-menu user-dropdown">
      <div className="user-dropdown-header">
        <div className="user-dropdown-user-info">
          <div className="user-avatar">
            {getInitials(userName)}
          </div>
          <div className="user-details">
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
        </div>
      </div>
      
      <div className="dropdown-menu-items">
        <a href="/mon-profil" className="dropdown-item">
          <i className="fas fa-user-circle"></i>
          Mon profil
        </a>
        <a href="/parametres" className="dropdown-item">
          <i className="fas fa-cog"></i>
          Paramètres
        </a>
        <div className="dropdown-divider"></div>
        <button onClick={onLogout} className="dropdown-item text-danger">
          <i className="fas fa-sign-out-alt"></i>
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
