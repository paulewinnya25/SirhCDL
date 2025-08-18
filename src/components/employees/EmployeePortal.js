import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import '../../styles/EmployeePortal.css';
import { 
  employeeService, 
  requestService, 
  sanctionService, 
  evenementService, 
  noteService 
} from '../../services/api';
import EmployeeNotes from '../common/EmployeeNotes';
import ChangePasswordModal from './ChangePasswordModal';
import VoiceAssistantButton from './VoiceAssistantButton';

// Composant pour la modale de détails des sanctions
const SanctionDetailsModal = ({ sanction, isOpen, onClose }) => {
  if (!isOpen || !sanction) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Détails de la sanction</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="sanction-detail-item">
            <span className="detail-label">Type de sanction:</span>
            <span className="detail-value">{sanction.type_sanction}</span>
          </div>
          <div className="sanction-detail-item">
            <span className="detail-label">Statut:</span>
            <span className="detail-value">
              <span className={`status-badge ${sanction.statut === 'En cours' ? 'status-pending' : sanction.statut === 'Annulée' ? 'status-rejected' : 'status-completed'}`}>
                {sanction.statut}
              </span>
            </span>
          </div>
          <div className="sanction-detail-item">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{sanction.date}</span>
          </div>
          <div className="sanction-detail-item">
            <span className="detail-label">Contenu:</span>
            <div className="detail-text">{sanction.contenu_sanction}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeePortal = ({ onLogout }) => {
  // États pour les données utilisateur et les chargements
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const [sanctions, setSanctions] = useState([]);
  const [showSanctionDetailsModal, setShowSanctionDetailsModal] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  
  // États pour les modales
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // États pour les données de l'application
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Fonction pour voir les détails d'une sanction
  const viewSanctionDetails = (sanction) => {
    setSelectedSanction(sanction);
    setShowSanctionDetailsModal(true);
  };

  // Vérifier si l'utilisateur est connecté et charger ses données
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données utilisateur depuis sessionStorage
        const userData = sessionStorage.getItem('employeeUser');
        
        if (!userData) {
          console.log("Aucune donnée utilisateur trouvée, redirection vers la page de connexion");
          navigate('/EmployeeLogin');
          return;
        }
        
        const parsedUser = JSON.parse(userData);
        console.log("Données utilisateur trouvées:", parsedUser);
        
        // Stocker l'ID de l'utilisateur pour les requêtes ultérieures
        if (parsedUser.id) {
          setUserId(parsedUser.id);
          
          try {
            // Récupérer les données complètes de l'utilisateur depuis l'API
            console.log("Récupération des données complètes de l'utilisateur avec ID:", parsedUser.id);
            const completeUserData = await employeeService.getById(parsedUser.id);
            console.log("Données complètes récupérées:", completeUserData);
            
            // Fusionner les données existantes avec les données complètes
            setUser({...parsedUser, ...completeUserData});
          } catch (apiError) {
            console.error("Erreur lors de la récupération des données complètes:", apiError);
            // En cas d'erreur, utiliser les données de session uniquement
            setUser(parsedUser);
          }
        } else {
          console.log("ID utilisateur non trouvé dans les données de session");
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        navigate('/EmployeeLogin');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Charger les annonces, demandes, documents et planning une fois que l'utilisateur est chargé
  useEffect(() => {
    const loadData = async () => {
      if (user?.nom_prenom) {
        try {
          console.log("Chargement des événements à venir");
          const upcomingEvents = await evenementService.getUpcoming();
          console.log("Événements récupérés:", upcomingEvents);
          setEvents(upcomingEvents);
        } catch (eventError) {
          console.error("Erreur lors du chargement des événements:", eventError);
          // En cas d'erreur, vous pouvez définir des données fictives ou laisser un tableau vide
          setEvents([
            {
              id: 1,
              name: 'Réunion mensuelle',
              formatted_date: '24/06/2025',
              location: 'Salle de conférence',
              description: 'Réunion mensuelle pour discuter des objectifs du mois.'
            },
            {
              id: 2,
              name: 'Formation Excel',
              formatted_date: '25/06/2025',
              location: 'Salle de formation',
              description: 'Formation sur les fonctionnalités avancées d\'Excel.'
            },
            {
              id: 3,
              name: 'Team Building',
              formatted_date: '27/06/2025',
              location: 'Parc des Cèdres',
              description: 'Activité de cohésion d\'équipe en plein air.'
            }
          ]);
        }
        
        try {
          console.log("Chargement des sanctions pour l'employé:", user.nom_prenom);
          const userSanctions = await sanctionService.getByEmployeeName(user.nom_prenom);
          console.log("Sanctions récupérées:", userSanctions);
          setSanctions(userSanctions);
        } catch (sanctionError) {
          console.error("Erreur lors du chargement des sanctions:", sanctionError);
          // En cas d'erreur, ne pas définir de données fictives pour les sanctions
          setSanctions([]);
        }
        
        try {
          // Charger les notes de service publiques
          setLoadingNotes(true);
          console.log("Chargement des notes de service publiques");
          const notesData = await noteService.getPublicNotes();
          console.log("Notes récupérées:", notesData);
          setNotes(notesData);
        } catch (notesError) {
          console.error("Erreur lors du chargement des notes de service:", notesError);
          // En cas d'erreur, définir un tableau vide ou des données fictives
          setNotes([
            {
              id: 1,
              full_note_number: 'NS-2025-001',
              category: 'Information',
              title: 'Nouveau processus de congés',
              content: 'Suite à la réunion du comité de direction, nous mettons en place un nouveau processus de demande de congés à partir du 1er juillet 2025.',
              created_at: '2025-06-20'
            },
            {
              id: 2,
              full_note_number: 'NS-2025-002',
              category: 'Organisation',
              title: 'Horaires d\'été',
              content: 'Les horaires d\'été seront appliqués du 1er juillet au 31 août 2025.',
              created_at: '2025-06-22'
            }
          ]);
        } finally {
          setLoadingNotes(false);
        }
      }
      
      if (!userId) return;
      
      try {
        // Charger les demandes de l'utilisateur
        try {
          console.log("Chargement des demandes pour l'utilisateur ID:", userId);
          const userRequests = await requestService.getByEmployeeId(userId);
          console.log("Demandes récupérées:", userRequests);
          setEmployeeRequests(userRequests);
        } catch (reqError) {
          console.error("Erreur lors du chargement des demandes:", reqError);
          // En cas d'erreur, utiliser des données fictives
          setEmployeeRequests([
            {
              id: 101,
              type: 'leave',
              status: 'pending',
              startDate: '2025-07-20',
              endDate: '2025-07-25',
              submitDate: '2025-06-10'
            },
            {
              id: 102,
              type: 'document',
              status: 'approved',
              description: 'Attestation de travail',
              submitDate: '2025-06-05',
              responseDate: '2025-06-07'
            }
          ]);
        }
        
        // Charger les annonces (données fictives pour l'instant)
        // setAnnouncements([
        //   {
        //     id: 1,
        //     title: 'Mise à jour des protocoles médicaux',
        //     date: '15 juin 2025',
        //     content: 'Chers employés, veuillez noter que les nouveaux protocoles médicaux seront mis en place à partir du 1er juillet. Une formation sera organisée la semaine prochaine.',
        //     priority: 'high'
        //   },
        //   {
        //     id: 2,
        //     title: 'Journée portes ouvertes',
        //     date: '10 juin 2025',
        //     content: 'Nous organisons une journée portes ouvertes le 25 juillet. Votre participation est encouragée pour présenter nos services aux visiteurs.',
        //     priority: 'medium'
        //   }
        // ]);
        
        // Charger les documents (données fictives pour l'instant)
        setDocuments([
          {
            id: 201,
            name: 'Fiche de paie - Mai 2025',
            type: 'payslip',
            date: '2025-06-01',
            size: '245 KB'
          },
          {
            id: 202,
            name: 'Attestation employeur',
            type: 'certificate',
            date: '2025-05-15',
            size: '120 KB'
          },
          {
            id: 203,
            name: 'Contrat de travail',
            type: 'contract',
            date: '2024-01-10',
            size: '350 KB'
          }
        ]);
        
        // Charger le planning (données fictives pour l'instant)
        // setSchedule([
        //   {
        //     id: 301,
        //     date: '2025-06-15',
        //     startTime: '08:00',
        //     endTime: '16:00',
        //     department: user?.entity || 'Radiologie'
        //   },
        //   {
        //     id: 302,
        //     date: '2025-06-16',
        //     startTime: '09:00',
        //     endTime: '17:00',
        //     department: user?.entity || 'Radiologie'
        //   },
        //   {
        //     id: 303,
        //     date: '2025-06-17',
        //     startTime: '08:00',
        //     endTime: '16:00',
        //     department: user?.entity || 'Radiologie'
        //   }
        // ]);
        
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Une erreur est survenue lors du chargement des données. Veuillez réessayer.");
      }
    };
    
    loadData();
  }, [userId, user]);
  
  // Fonction pour formater la date des événements
  const formatEventDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Si la date est déjà formatée (comme "24/06/2025")
      if (dateString.includes('/')) {
        return dateString;
      }
      
      // Sinon, formater la date
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", dateString, error);
      return dateString;
    }
  };
  
  // Fonction de déconnexion
  const handleLogout = () => {
    // Appeler la fonction de déconnexion de l'App.js si elle existe
    if (onLogout) {
      onLogout();
    }
    
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('employeeUser');
    sessionStorage.removeItem('token');
    
    // Rediriger vers la page de connexion employé
    navigate('/employee-login');
  };
  
  // Obtenir la date d'aujourd'hui
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Fonction pour gérer le type de demande et ouvrir la modale
  const handleNewRequest = (type) => {
    setRequestType(type);
    setShowNewRequestModal(true);
  };

  // Fonction pour fermer la modale de nouvelle demande
  const closeNewRequestModal = () => {
    setShowNewRequestModal(false);
    setRequestType('');
  };

  // Fonction pour soumettre une nouvelle demande
  const submitNewRequest = async (formData) => {
    try {
      // Appeler l'API pour créer une nouvelle demande
      // En fonction du type de demande, vous appellerez différentes API
      if (requestType === 'leave') {
        const newRequest = await requestService.create({
          employee_id: userId,
          request_type: 'leave',
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          request_details: formData.details,
          status: 'pending'
        });
        
        // Ajouter la nouvelle demande à la liste
        setEmployeeRequests(prev => [newRequest, ...prev]);
      } else if (requestType === 'document') {
        const newRequest = await requestService.create({
          employee_id: userId,
          request_type: 'document',
          request_details: formData.details,
          reason: formData.reason,
          status: 'pending'
        });
        
        // Ajouter la nouvelle demande à la liste
        setEmployeeRequests(prev => [newRequest, ...prev]);
      } else {
        // Autre type de demande
        const newRequest = await requestService.create({
          employee_id: userId,
          request_type: 'other',
          request_details: formData.details,
          reason: formData.reason,
          status: 'pending'
        });
        
        // Ajouter la nouvelle demande à la liste
        setEmployeeRequests(prev => [newRequest, ...prev]);
      }
      
      // Afficher un message de succès
      setSuccessMessage('Votre demande a été soumise avec succès.');
      
      // Fermer la modale
      closeNewRequestModal();
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      setError('Une erreur est survenue lors de la création de la demande. Veuillez réessayer.');
    }
  };

  // Fonction pour annuler une demande
  const cancelRequest = async (requestId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      return;
    }
    
    try {
      // Appeler l'API pour annuler la demande
      await requestService.delete(requestId);
      
      // Mettre à jour la liste des demandes
      setEmployeeRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Afficher un message de succès
      setSuccessMessage('Votre demande a été annulée avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la demande:', error);
      setError('Une erreur est survenue lors de l\'annulation de la demande. Veuillez réessayer.');
    }
  };

  // Fonction pour voir les détails d'une demande
  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailsModal(true);
  };

  // Fonction pour voir un document
  const viewDocument = (document) => {
    // setSelectedDocument(document); // This line was removed as per the edit hint
    // setShowDocumentViewModal(true); // This line was removed as per the edit hint
  };

  // Fonction pour télécharger un document
  const downloadDocument = (document) => {
    // Simuler un téléchargement
    alert(`Téléchargement du document "${document.name}" en cours...`);
    
    // En production, vous utiliseriez une API réelle pour télécharger le document
    // window.open(`${API_URL}/documents/download/${document.id}`, '_blank');
  };
  
  // Fonction pour formater une date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", dateString, error);
      return dateString;
    }
  };
  
  // Obtenir l'icône pour un type de document
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'payslip':
        return 'fa-file-invoice-dollar';
      case 'certificate':
        return 'fa-certificate';
      case 'contract':
        return 'fa-file-signature';
      default:
        return 'fa-file-alt';
    }
  };
  
  // Obtenir l'icône et la classe pour un type de demande
  const getRequestInfo = (type, status) => {
    let icon = '';
    let statusClass = '';
    let statusText = '';
    
    // Icône selon le type
    switch (type) {
      case 'leave':
        icon = 'fa-calendar-alt';
        break;
      case 'document':
        icon = 'fa-file-alt';
        break;
      default:
        icon = 'fa-question-circle';
    }
    
    // Classe et texte selon le statut
    switch (status) {
      case 'pending':
        statusClass = 'status-pending';
        statusText = 'En attente';
        break;
      case 'approved':
        statusClass = 'status-approved';
        statusText = 'Approuvé';
        break;
      case 'rejected':
        statusClass = 'status-rejected';
        statusText = 'Refusé';
        break;
      default:
        statusClass = '';
        statusText = 'Inconnu';
    }
    
    return { icon, statusClass, statusText };
  };
  
  // Afficher un écran de chargement pendant que les données sont récupérées
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p>Chargement de votre espace personnel...</p>
      </div>
    );
  }

  // Vérifier si l'utilisateur est défini
  if (!user) {
    return (
      <div className="loading-container">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          Impossible de charger les données utilisateur. Veuillez vous reconnecter.
        </div>
        <button 
          className="btn btn-primary mt-3" 
          onClick={() => navigate('/EmployeeLogin')}
        >
          Retour à la page de connexion
        </button>
      </div>
    );
  }

  return (
    <div className="employee-portal">
      {/* Sidebar */}
      <div className="portal-sidebar">
        <div className="sidebar-header">
          <img 
            src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png" 
            alt="Logo" 
            className="sidebar-logo" 
          />
          <h3>Portail Employé</h3>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.nom_prenom?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <h4>{user?.nom_prenom || 'Utilisateur'}</h4>
            <p>{user?.email || 'employee@centredg.com'}</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''}>
              <button onClick={() => setActiveTab('dashboard')}>
                <i className="fas fa-home"></i>
                <span>Tableau de bord</span>
              </button>
            </li>
            
            <li className={activeTab === 'documents' ? 'active' : ''}>
              <button onClick={() => setActiveTab('documents')}>
                <i className="fas fa-file-alt"></i>
                <span>Documents</span>
              </button>
            </li>
            
            <li className={activeTab === 'requests' ? 'active' : ''}>
              <button onClick={() => setActiveTab('requests')}>
                <i className="fas fa-paper-plane"></i>
                <span>Mes demandes</span>
              </button>
            </li>
            
            <li className={activeTab === 'notes' ? 'active' : ''}>
              <button onClick={() => setActiveTab('notes')}>
                <i className="fas fa-clipboard-list"></i>
                <span>Notes de service</span>
                {notes.length > 0 && (
                  <span className="badge">{notes.length}</span>
                )}
              </button>
            </li>

            <li className={activeTab === 'events' ? 'active' : ''}>
  <button onClick={() => setActiveTab('events')}>
    <i className="fas fa-calendar-week"></i>
    <span>Événements</span>
  </button>
</li>
            
            <li className={activeTab === 'sanctions' ? 'active' : ''}>
              <button onClick={() => setActiveTab('sanctions')}>
                <i className="fas fa-gavel"></i>
                <span>Mes sanctions</span>
                {sanctions.length > 0 && (
                  <span className="badge">{sanctions.length}</span>
                )}
              </button>
            </li>
            
            <li className={activeTab === 'profile' ? 'active' : ''}>
              <button onClick={() => setActiveTab('profile')}>
                <i className="fas fa-user"></i>
                <span>Mon profil</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="portal-content">
        <header className="content-header">
          <div>
            <h2>
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'documents' && 'Mes documents'}
              {activeTab === 'requests' && 'Mes demandes'}
              {activeTab === 'notes' && 'Notes de service'}
              {activeTab === 'evenements' && 'Evenements'}
              {activeTab === 'sanctions' && 'Mes sanctions'}
              {activeTab === 'profile' && 'Mon profil'}
            </h2>
            <p className="date-display">{formattedDate}</p>
          </div>
          
          <div className="header-actions">
            <button className="btn-icon" onClick={() => alert('Vous avez 2 nouvelles notifications')}>
              <i className="fas fa-bell"></i>
              <span className="notification-badge">2</span>
            </button>
            <button className="btn-icon" onClick={() => alert('Paramètres du compte')}>
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </header>
        
        {/* Afficher un message d'erreur global si nécessaire */}
        {error && (
          <div className="alert alert-danger m-3" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close float-end" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Afficher un message de succès si nécessaire */}
        {successMessage && (
          <div className="alert alert-success m-3" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
            <button 
              type="button" 
              className="btn-close float-end" 
              onClick={() => setSuccessMessage(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        <main className="content-body">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              <div className="welcome-card">
                <div>
                  <h3>Bienvenue, {user?.nom_prenom?.split(' ')[0] || 'Utilisateur'}</h3>
                  <p>Voici un résumé de vos informations et activités récentes.</p>
                </div>
                <div className="welcome-image">
                  <img 
                    src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png" 
                    alt="Welcome" 
                  />
                </div>
              </div>
              
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <div className="card-header">
                    <h4>Événements à venir</h4>
                    <button className="btn-sm" onClick={() => setActiveTab('events')}>Voir tout</button>
                  </div>
                  <div className="card-body scrollable">
                    {loading ? (
                      <div className="text-center p-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="empty-state">
                        <i className="far fa-calendar-times fa-2x mb-2"></i>
                        <p>Aucun événement prévu prochainement.</p>
                      </div>
                    ) : (
                      <div className="events-list">
                        {events.slice(0, 3).map((event) => (
                          <div className="event-item" key={event.id}>
                            <div className="event-meta">
                              <span className="event-date">
                                <i className="far fa-calendar-alt"></i> {event.formatted_date || formatEventDate(event.date)}
                              </span>
                              <span className="event-location">
                                <i className="fas fa-map-marker-alt"></i> {event.location}
                              </span>
                            </div>
                            <h5 className="event-name">{event.name}</h5>
                            <p className="event-description">
                              {event.description.length > 100 
                                ? `${event.description.substring(0, 100)}...` 
                                : event.description
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-header">
                    <h4>Mes demandes récentes</h4>
                    <button className="btn-sm" onClick={() => setShowNewRequestModal(true)}>Nouvelle demande</button>
                  </div>
                  <div className="card-body scrollable">
                    {employeeRequests.length === 0 ? (
                      <p className="empty-state">Vous n'avez pas de demandes récentes.</p>
                    ) : (
                      employeeRequests.map(request => {
                        const { icon, statusClass, statusText } = getRequestInfo(request.type || request.request_type, request.status);
                        return (
                          <div className="request-item" key={request.id}>
                            <div className="request-icon">
                              <i className={`fas ${icon}`}></i>
                            </div>
                            <div className="request-details">
                              <div className="request-header">
                                <h5>
                                  {(request.type || request.request_type) === 'leave' ? 'Demande de congé' : 
                                   (request.type || request.request_type) === 'document' ? 'Demande de document' : 'Autre demande'}
                                </h5>
                                <span className={`status-badge ${statusClass}`}>{statusText}</span>
                              </div>
                              <p className="request-date">Soumise le {formatDate(request.submitDate || request.request_date)}</p>
                              {(request.type || request.request_type) === 'leave' && (
                                <p className="request-period">
                                  Du {formatDate(request.startDate || request.start_date)} au {formatDate(request.endDate || request.end_date)}
                                </p>
                              )}
                              {(request.description || request.request_details) && (
                                <p className="request-description">{request.description || request.request_details}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-header">
                    <h4>Notes de Service</h4>
                    <button className="btn-sm" onClick={() => setActiveTab('notes')}>Voir tout</button>
                  </div>
                  <div className="card-body scrollable">
                    {loadingNotes ? (
                      <div className="text-center p-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="empty-state">
                        <i className="far fa-file-alt fa-2x mb-2"></i>
                        <p>Aucune note de service disponible.</p>
                      </div>
                    ) : (
                      <div className="notes-list">
                        {notes.slice(0, 3).map((note) => (
                          <div className="note-item" key={note.id}>
                            <div className="note-meta">
                              <span className="note-date">
                                <i className="far fa-calendar-alt"></i> {formatDate(note.created_at)}
                              </span>
                              <span className="note-category">
                                {note.category}
                              </span>
                            </div>
                            <h5 className="note-title">{note.title}</h5>
                            <p className="note-description">
                              {note.content.length > 100 
                                ? `${note.content.substring(0, 100)}...` 
                                : note.content
                              }
                            </p>
                            <button 
                              className="btn-sm" 
                              onClick={() => {
                                setActiveTab('notes');
                              }}
                            >
                              Voir détails
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="documents-tab">
              <div className="documents-header">
                <h3>Mes documents</h3>
                <div className="documents-actions">
                  <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Rechercher un document..." className="search-input" />
                  </div>
                  <select className="form-select">
                    <option value="all">Tous les types</option>
                    <option value="payslip">Fiches de paie</option>
                    <option value="certificate">Attestations</option>
                    <option value="contract">Contrats</option>
                  </select>
                </div>
              </div>
              
              <div className="documents-list">
                {documents.map(doc => (
                  <div className="document-card" key={doc.id}>
                    <div className="document-icon">
                      <i className={`fas ${getDocumentIcon(doc.type)}`}></i>
                    </div>
                    <div className="document-info">
                      <h5>{doc.name}</h5>
                      <div className="document-meta">
                        <span><i className="fas fa-calendar-alt"></i> {formatDate(doc.date)}</span>
                        <span><i className="fas fa-file-alt"></i> {doc.size}</span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button className="btn-icon" title="Télécharger" onClick={() => downloadDocument(doc)}>
                        <i className="fas fa-download"></i>
                      </button>
                      <button className="btn-icon" title="Voir" onClick={() => viewDocument(doc)}>
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="document-request">
                <h4>Demander un document</h4>
                <p>Vous ne trouvez pas le document que vous cherchez ? Faites une demande auprès du service RH.</p>
                <button className="btn-primary" onClick={() => handleNewRequest('document')}>
                  <i className="fas fa-plus"></i> Nouvelle demande
                </button>
              </div>
            </div>
          )}
          
          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="requests-tab">
              <div className="requests-header">
                <h3>Mes demandes</h3>
                <div className="requests-actions">
                  <button className="btn-primary" onClick={() => setShowNewRequestModal(true)}>
                    <i className="fas fa-plus"></i> Nouvelle demande
                  </button>
                </div>
              </div>
              
              <div className="request-types">
                <div className="request-type-card">
                  <div className="request-type-icon leave-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <h4>Congés</h4>
                  <p>Demander des jours de congés ou des absences.</p>
                  <button className="btn-outline" onClick={() => handleNewRequest('leave')}>Demander</button>
                </div>
                
                <div className="request-type-card">
                  <div className="request-type-icon document-icon">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <h4>Documents</h4>
                  <p>Demander une attestation ou un autre document.</p>
                  <button className="btn-outline" onClick={() => handleNewRequest('document')}>Demander</button>
                </div>
                
                <div className="request-type-card">
                  <div className="request-type-icon other-icon">
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <h4>Autres</h4>
                  <p>Faire une demande spécifique ou poser une question.</p>
                  <button className="btn-outline" onClick={() => handleNewRequest('other')}>Demander</button>
                </div>
              </div>
              
              <div className="requests-history">
                <h4>Historique des demandes</h4>
                
                <div className="history-filters">
                  <select className="form-select">
                    <option value="all">Tous les types</option>
                    <option value="leave">Congés</option>
                    <option value="document">Documents</option>
                    <option value="other">Autres</option>
                  </select>
                  
                  <select className="form-select">
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Refusé</option>
                  </select>
                </div>
                
                <div className="requests-list">
                  {employeeRequests.length === 0 ? (
                    <p className="empty-state p-4">Vous n'avez pas encore de demandes.</p>
                  ) : (
                    employeeRequests.map(request => {
                      const { icon, statusClass, statusText } = getRequestInfo(
                        request.type || request.request_type, 
                        request.status
                      );
                      return (
                        <div className="request-history-item" key={request.id}>
                          <div className="request-history-icon">
                            <i className={`fas ${icon}`}></i>
                          </div>
                          <div className="request-history-details">
                            <div className="request-history-header">
                              <h5>
                                {(request.type || request.request_type) === 'leave' ? 'Demande de congé' : 
                                 (request.type || request.request_type) === 'document' ? 'Demande de document' : 'Autre demande'}
                              </h5>
                              <span className={`status-badge ${statusClass}`}>{statusText}</span>
                            </div>
                            <p className="request-history-date">Soumise le {formatDate(request.submitDate || request.request_date)}</p>
                            {(request.type || request.request_type) === 'leave' && (
                              <p className="request-history-period">
                                Du {formatDate(request.startDate || request.start_date)} au {formatDate(request.endDate || request.end_date)}
                              </p>
                            )}
                            {(request.description || request.request_details) && (
                              <p className="request-history-description">{request.description || request.request_details}</p>
                            )}
                          </div>
                          <div className="request-history-actions">
                            <button className="btn-icon" title="Voir détails" onClick={() => viewRequestDetails(request)}>
                              <i className="fas fa-eye"></i>
                            </button>
                            {request.status === 'pending' && (
                              <button className="btn-icon" title="Annuler la demande" onClick={() => cancelRequest(request.id)}>
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Notes de service Tab */}
          {activeTab === 'notes' && (
            <div className="notes-tab">
              <EmployeeNotes />
            </div>
          )}

          {/* Sanctions Tab */}
          {activeTab === 'sanctions' && (
            <div className="sanctions-tab">
              <div className="sanctions-header">
                <h3>Mes sanctions disciplinaires</h3>
              </div>
              
              {sanctions.length === 0 ? (
                <div className="empty-state p-4 text-center">
                  <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                  <h4>Aucune sanction</h4>
                  <p>Vous n'avez pas de sanctions disciplinaires à votre dossier.</p>
                </div>
              ) : (
                <div className="sanctions-list">
                  {sanctions.map(sanction => (
                    <div className="sanction-card" key={sanction.id}>
                      <div className="sanction-header">
                        <h4>{sanction.type_sanction}</h4>
                        <span className={`status-badge ${sanction.statut === 'En cours' ? 'status-pending' : sanction.statut === 'Annulée' ? 'status-rejected' : 'status-completed'}`}>
                          {sanction.statut}
                        </span>
                      </div>
                      <div className="sanction-body">
                        <p className="sanction-date">
                          <i className="fas fa-calendar-alt"></i> Date: {formatDate(sanction.date)}
                        </p>
                        <div className="sanction-content">
                          <p>
                            {sanction.contenu_sanction.length > 200 
                              ? sanction.contenu_sanction.substring(0, 200) + '...' 
                              : sanction.contenu_sanction
                            }
                          </p>
                        </div>
                      </div>
                      <div className="sanction-footer">
                        <button 
                          className="btn-primary"
                          onClick={() => viewSanctionDetails(sanction)}
                        >
                          <i className="fas fa-eye"></i> Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

{activeTab === 'events' && (
  <div className="events-tab">
    <div className="events-header">
      <h3>Calendrier des événements</h3>
    </div>
    
    <div className="events-container">
      {loading ? ( // Changed from isLoading to loading
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="alert alert-info text-center">
          <i className="fas fa-info-circle me-2"></i>
          Aucun événement prévu prochainement.
        </div>
      ) : (
        <div className="events-list-full">
          {events.map((event) => (
            <div className="event-card" key={event.id}>
              <div className="event-date-badge">
                <div className="date-day">
                  {new Date(event.date).getDate()}
                </div>
                <div className="date-month">
                  {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </div>
              <div className="event-content">
                <h4 className="event-title">{event.name}</h4>
                <div className="event-details">
                  <p className="event-location">
                    <i className="fas fa-map-marker-alt"></i> {event.location}
                  </p>
                  <p className="event-time">
                    <i className="fas fa-clock"></i> Toute la journée
                  </p>
                </div>
                <p className="event-description">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="profile-header">
                <div className="profile-avatar">
                  {user?.nom_prenom?.charAt(0) || 'U'}
                </div>
                <div className="profile-header-info">
                  <h3>{user?.nom_prenom || 'Utilisateur'}</h3>
                  <p className="profile-title">{user?.poste_actuel || 'Poste non spécifié'}</p>
                  <p className="profile-id">ID Employé: {user?.id || 'Non disponible'}</p>
                </div>
                <div className="profile-actions">
                  <button className="btn-outline" onClick={() => alert('Fonctionnalité de modification du profil en développement')}>
                    <i className="fas fa-edit"></i> Modifier profil
                  </button>
                </div>
              </div>
              
              <div className="profile-sections">
                <div className="profile-section">
                  <h4>Informations personnelles</h4>
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <span className="info-label">Nom complet</span>
                      <span className="info-value">{user?.nom_prenom || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user?.email || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Téléphone</span>
                      <span className="info-value">{user?.telephone || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Date de naissance</span>
                      <span className="info-value">{user?.date_naissance ? formatDate(user.date_naissance) : 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Adresse</span>
                      <span className="info-value">{user?.adresse || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Nationalité</span>
                      <span className="info-value">{user?.nationalite || 'Non disponible'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="profile-section">
                  <h4>Informations professionnelles</h4>
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <span className="info-label">Département</span>
                      <span className="info-value">{user?.entity || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Poste</span>
                      <span className="info-value">{user?.poste_actuel || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Date d'embauche</span>
                      <span className="info-value">{user?.date_entree ? formatDate(user.date_entree) : 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Type de contrat</span>
                      <span className="info-value">{user?.type_contrat || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Supérieur hiérarchique</span>
                      <span className="info-value">{user?.responsable || 'Non disponible'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label">Statut employé</span>
                      <span className="info-value">{user?.statut_employe || 'Non disponible'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="profile-section">
                  <h4>Sécurité du compte</h4>
                  <div className="security-options">
                    <button className="btn-outline" onClick={() => setShowChangePasswordModal(true)}>
                      <i className="fas fa-key"></i> Changer mot de passe
                    </button>
                    <button className="btn-outline" onClick={() => alert('Fonctionnalité d\'authentification à deux facteurs en développement')}>
                      <i className="fas fa-shield-alt"></i> Activer l'authentification à deux facteurs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modale pour nouvelle demande */}
          {showNewRequestModal && (
            <div className="modal-backdrop">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {requestType === 'leave' ? 'Nouvelle demande de congé' :
                     requestType === 'document' ? 'Nouvelle demande de document' :
                     'Nouvelle demande'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeNewRequestModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <Formik
                    initialValues={{
                      startDate: '',
                      endDate: '',
                      reason: '',
                      details: ''
                    }}
                    validate={values => {
                      const errors = {};
                      if (requestType === 'leave') {
                        if (!values.startDate) {
                          errors.startDate = 'La date de début est requise';
                        }
                        if (!values.endDate) {
                          errors.endDate = 'La date de fin est requise';
                        } else if (values.endDate < values.startDate) {
                          errors.endDate = 'La date de fin doit être postérieure à la date de début';
                        }
                      }
                      if (!values.reason) {
                        errors.reason = 'Le motif est requis';
                      }
                      return errors;
                    }}
                    onSubmit={submitNewRequest}
                  >
                    {({ isSubmitting, errors, touched }) => (
                      <Form>
                        {requestType === 'leave' && (
                          <>
                            <div className="mb-3">
                              <label htmlFor="startDate" className="form-label">Date de début <span className="text-danger">*</span></label>
                              <Field
                                name="startDate"
                                type="date"
                                className={`form-control ${errors.startDate && touched.startDate ? 'is-invalid' : ''}`}
                              />
                              <ErrorMessage name="startDate" component="div" className="invalid-feedback" />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="endDate" className="form-label">Date de fin <span className="text-danger">*</span></label>
                              <Field
                                name="endDate"
                                type="date"
                                className={`form-control ${errors.endDate && touched.endDate ? 'is-invalid' : ''}`}
                              />
                              <ErrorMessage name="endDate" component="div" className="invalid-feedback" />
                            </div>
                          </>
                        )}
                        
                        <div className="mb-3">
                          <label htmlFor="reason" className="form-label">Motif <span className="text-danger">*</span></label>
                          <Field
                            name="reason"
                            as="select"
                            className={`form-select ${errors.reason && touched.reason ? 'is-invalid' : ''}`}
                          >
                            <option value="">Sélectionnez un motif</option>
                            {requestType === 'leave' && (
                              <>
                                <option value="Congés payés">Congés payés</option>
                                <option value="Maladie">Maladie</option>
                                <option value="Événement familial">Événement familial</option>
                                <option value="Formation">Formation</option>
                                <option value="Autre">Autre</option>
                              </>
                            )}
                            {requestType === 'document' && (
                              <>
                                <option value="Attestation de travail">Attestation de travail</option>
                                <option value="Bulletin de salaire">Bulletin de salaire</option>
                                <option value="Certificat de travail">Certificat de travail</option>
                                <option value="Autre">Autre</option>
                              </>
                            )}
                            {requestType !== 'leave' && requestType !== 'document' && (
                              <>
                                <option value="Question RH">Question RH</option>
                                <option value="Problème technique">Problème technique</option>
                                <option value="Suggestion">Suggestion</option>
                                <option value="Autre">Autre</option>
                              </>
                            )}
                          </Field>
                          <ErrorMessage name="reason" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="details" className="form-label">Détails</label>
                          <Field
                            name="details"
                            as="textarea"
                            className="form-control"
                            rows="4"
                            placeholder="Précisez les détails de votre demande ici..."
                          />
                        </div>
                        
                        <div className="d-flex justify-content-end">
                          <button 
                            type="button" 
                            className="btn btn-secondary me-2" 
                            onClick={closeNewRequestModal}
                          >
                            Annuler
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Envoi...
                              </>
                            ) : (
                              'Soumettre la demande'
                            )}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          )}

          {/* Modale pour voir les détails d'une demande */}
          {showRequestDetailsModal && selectedRequest && (
            <div className="modal-backdrop">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Détails de la demande</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowRequestDetailsModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="request-detail-item">
                    <span className="detail-label">Type de demande:</span>
                    <span className="detail-value">
                      {(selectedRequest.type || selectedRequest.request_type) === 'leave' ? 'Congé' : 
                      (selectedRequest.type || selectedRequest.request_type) === 'document' ? 'Document' : 'Autre'}
                    </span>
                  </div>
                  
                  <div className="request-detail-item">
                    <span className="detail-label">Statut:</span>
                    <span className="detail-value">
                      <span className={`status-badge ${getRequestInfo(
                        selectedRequest.type || selectedRequest.request_type, 
                        selectedRequest.status
                      ).statusClass}`}>
                        {getRequestInfo(
                          selectedRequest.type || selectedRequest.request_type, 
                          selectedRequest.status
                        ).statusText}
                      </span>
                    </span>
                  </div>
                  
                  <div className="request-detail-item">
                    <span className="detail-label">Date de soumission:</span>
                    <span className="detail-value">
                      {formatDate(selectedRequest.submitDate || selectedRequest.request_date)}
                    </span>
                  </div>
                  
                  {(selectedRequest.type || selectedRequest.request_type) === 'leave' && (
                    <>
                      <div className="request-detail-item">
                        <span className="detail-label">Période:</span>
                        <span className="detail-value">
                          Du {formatDate(selectedRequest.startDate || selectedRequest.start_date)} 
                          au {formatDate(selectedRequest.endDate || selectedRequest.end_date)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="request-detail-item">
                    <span className="detail-label">Motif:</span>
                    <span className="detail-value">
                      {selectedRequest.reason}
                    </span>
                  </div>
                  
                  {(selectedRequest.details || selectedRequest.request_details) && (
                    <div className="request-detail-item">
                      <span className="detail-label">Détails:</span>
                      <div className="detail-text">
                        {selectedRequest.details || selectedRequest.request_details}
                      </div>
                    </div>
                  )}
                  
                  {selectedRequest.status !== 'pending' && (
                    <>
                      <div className="request-detail-item">
                        <span className="detail-label">Date de réponse:</span>
                        <span className="detail-value">
                          {formatDate(selectedRequest.responseDate || selectedRequest.response_date)}
                        </span>
                      </div>
                      
                      {(selectedRequest.responseComments || selectedRequest.response_comments) && (
                        <div className="request-detail-item">
                          <span className="detail-label">Commentaires:</span>
                          <div className="detail-text">
                            {selectedRequest.responseComments || selectedRequest.response_comments}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => setShowRequestDetailsModal(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modale pour voir les détails d'une sanction */}
          <SanctionDetailsModal 
            sanction={selectedSanction}
            isOpen={showSanctionDetailsModal}
            onClose={() => setShowSanctionDetailsModal(false)}
          />

          {/* Modale de changement de mot de passe */}
          <ChangePasswordModal
            isOpen={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
            user={user}
            onSuccess={(message) => {
              setSuccessMessage(message);
              // Rediriger vers la page de connexion après un délai
              setTimeout(() => {
                sessionStorage.removeItem('employeeUser');
                sessionStorage.removeItem('token');
                navigate('/EmployeeLogin');
              }, 3000);
            }}
          />

          {/* Bouton flottant de l'assistant vocal */}
          <VoiceAssistantButton user={user} />
        </main>
      </div>
    </div>
  );
};

export default EmployeePortal;