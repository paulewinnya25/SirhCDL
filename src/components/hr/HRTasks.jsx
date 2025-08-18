import React, { useState, useEffect } from 'react';
import '../../styles/Tables.css';
import '../../styles/Forms.css';

const HRTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    // Simuler le chargement des tâches RH
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // TODO: Remplacer par un appel API réel
        const mockTasks = [
          {
            id: 1,
            title: 'Mise à jour des contrats',
            description: 'Vérifier et mettre à jour les contrats arrivant à expiration',
            priority: 'Haute',
            status: 'En cours',
            assigned_to: 'Marie Martin',
            due_date: '2025-01-20',
            category: 'Contrats'
          },
          {
            id: 2,
            title: 'Formation sécurité',
            description: 'Organiser la formation sécurité pour les nouveaux employés',
            priority: 'Moyenne',
            status: 'Planifié',
            assigned_to: 'Pierre Durand',
            due_date: '2025-01-25',
            category: 'Formation'
          },
          {
            id: 3,
            title: 'Évaluation des performances',
            description: 'Finaliser les évaluations de fin d\'année',
            priority: 'Haute',
            status: 'Terminé',
            assigned_to: 'Sophie Bernard',
            due_date: '2025-01-15',
            category: 'Performance'
          }
        ];
        
        setTasks(mockTasks);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des tâches');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Haute':
        return 'priority-high';
      case 'Moyenne':
        return 'priority-medium';
      case 'Basse':
        return 'priority-low';
      default:
        return '';
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
          <h1 className="page-title">Démarches RH</h1>
          <p className="page-subtitle">Gestion des tâches et démarches RH</p>
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
              <i className="fas fa-tasks me-2"></i>
              Liste des tâches RH
            </h5>
            <button 
              className="btn btn-primary"
              onClick={handleAddTask}
            >
              <i className="fas fa-plus me-2"></i>
              Nouvelle tâche
            </button>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Aucune tâche RH en cours.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Description</th>
                      <th>Catégorie</th>
                      <th>Priorité</th>
                      <th>Statut</th>
                      <th>Assigné à</th>
                      <th>Date limite</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <div className="fw-bold">{task.title}</div>
                        </td>
                        <td>
                          <div className="text-muted">{task.description}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {task.category}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getPriorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusClass(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td>{task.assigned_to}</td>
                        <td>{formatDate(task.due_date)}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditTask(task)}
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteTask(task.id)}
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

export default HRTasks;

