import React, { useState, useEffect } from 'react';
import '../../styles/Tables.css';
import '../../styles/Forms.css';

const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    // Simuler le chargement des entretiens
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        // TODO: Remplacer par un appel API réel
        const mockInterviews = [
          {
            id: 1,
            candidate_name: 'Jean Dupont',
            position: 'Développeur Frontend',
            date: '2025-01-15',
            time: '14:00',
            interviewer: 'Marie Martin',
            status: 'Planifié',
            type: 'Technique'
          },
          {
            id: 2,
            candidate_name: 'Sophie Bernard',
            position: 'Responsable Marketing',
            date: '2025-01-16',
            time: '10:00',
            interviewer: 'Pierre Durand',
            status: 'Terminé',
            type: 'RH'
          }
        ];
        
        setInterviews(mockInterviews);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des entretiens');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const handleAddInterview = () => {
    setSelectedInterview(null);
    setShowModal(true);
  };

  const handleEditInterview = (interview) => {
    setSelectedInterview(interview);
    setShowModal(true);
  };

  const handleDeleteInterview = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) {
      setInterviews(interviews.filter(interview => interview.id !== id));
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Planifié':
        return 'status-planned';
      case 'En cours':
        return 'status-ongoing';
      case 'Terminé':
        return 'status-completed';
      case 'Annulé':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="layout-container">
      <div className="page-content">
        <div className="page-title-wrapper">
          <h1 className="page-title">Gestion des entretiens</h1>
          <p className="page-subtitle">Planification et suivi des entretiens de recrutement</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-calendar-check me-2"></i>
              Liste des entretiens
            </h5>
            <button 
              className="btn btn-primary"
              onClick={handleAddInterview}
            >
              <i className="fas fa-plus me-2"></i>
              Nouvel entretien
            </button>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : interviews.length === 0 ? (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Aucun entretien planifié.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      <th>Poste</th>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Intervieweur</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((interview) => (
                      <tr key={interview.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar me-3">
                              {interview.candidate_name.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold">{interview.candidate_name}</div>
                            </div>
                          </div>
                        </td>
                        <td>{interview.position}</td>
                        <td>{formatDate(interview.date)}</td>
                        <td>{interview.time}</td>
                        <td>{interview.interviewer}</td>
                        <td>
                          <span className={`badge bg-${interview.type === 'Technique' ? 'primary' : 'secondary'}`}>
                            {interview.type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusClass(interview.status)}`}>
                            {interview.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditInterview(interview)}
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteInterview(interview.id)}
                              title="Supprimer"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interviews;

