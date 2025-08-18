import React from 'react';

const MessageBox = ({ gmailAuthenticated, gmailEmails, onClose }) => {
  return (
    <div className="dropdown-menu message-box">
      <div className="message-header">
        <h5 className="message-title">Messagerie Gmail</h5>
        <button className="message-refresh" title="Actualiser">
          <i className="fas fa-sync-alt"></i>
        </button>
        <button className="message-close" onClick={onClose} title="Fermer">
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="message-body">
        {gmailAuthenticated ? (
          <div className="email-list">
            {gmailEmails && gmailEmails.length > 0 ? (
              gmailEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <div className="email-sender">{email.sender}</div>
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-preview">{email.preview}</div>
                </div>
              ))
            ) : (
              <div className="no-emails">
                <i className="fas fa-inbox"></i>
                <p>Aucun email récent</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-envelope-open-text fa-3x text-muted mb-3"></i>
            <p>Connectez-vous à votre compte Gmail pour accéder à vos emails.</p>
            <button className="btn btn-success" style={{ marginTop: '15px' }}>
              <i className="fab fa-google me-2"></i>
              Se connecter à Gmail
            </button>
          </div>
        )}
      </div>
      
      <div className="message-form">
        <form>
          <input type="email" className="form-control" placeholder="Destinataire" required />
          <input type="text" className="form-control" placeholder="Objet" required />
          <textarea className="form-control" rows="3" placeholder="Votre message..." required></textarea>
          <button type="submit" className="message-send">
            <i className="fas fa-paper-plane me-2"></i> Envoyer
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageBox;