import React from 'react';

const NotificationsDropdown = () => {
  return (
    <div className="dropdown-menu notification-dropdown">
      <div className="notification-header">
        <h6>Notifications</h6>
      </div>
      
      <div className="notification-list">
        <div className="notification-item">
          <div className="notification-icon bg-primary-light">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="notification-content">
            <div className="notification-title">Nouvelle demande de congé</div>
            <div className="notification-time">Il y a 30 minutes</div>
          </div>
        </div>
        
        <div className="notification-item">
          <div className="notification-icon bg-success-light">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="notification-content">
            <div className="notification-title">Rapport mensuel généré</div>
            <div className="notification-time">Il y a 2 heures</div>
          </div>
        </div>
        
        <div className="notification-item">
          <div className="notification-icon bg-warning-light">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="notification-content">
            <div className="notification-title">Mise à jour du système</div>
            <div className="notification-time">Il y a 1 jour</div>
          </div>
        </div>
      </div>
      
      <div className="notification-footer">
        <a href="/notifications" className="view-all-link">
          Voir toutes les notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationsDropdown;