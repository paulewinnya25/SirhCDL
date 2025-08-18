import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { evenementService } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';

const EventManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Validation schema for event form
  const eventSchema = Yup.object().shape({
    name: Yup.string().required('Le nom est requis'),
    date: Yup.date()
      .required('La date est requise')
      .typeError('Veuillez entrer une date valide'),
    location: Yup.string().required('Le lieu est requis'),
    description: Yup.string().required('La description est requise')
  });

  useEffect(() => {
    // Fetch events from API
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await evenementService.getAll();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Erreur lors du chargement des événements. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle event submission
  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setError(null);

    try {
      let response;
      
      if (editMode && selectedEvent) {
        // Update existing event
        response = await evenementService.update(selectedEvent.id, values);
        
        // Update the events list
        setEvents(prev => 
          prev.map(event => event.id === selectedEvent.id ? response : event)
        );
      } else {
        // Create new event
        response = await evenementService.create(values);
        
        // Add the new event to the list
        setEvents(prev => [response, ...prev]);
      }
      
      // Success
      setSubmitSuccess(true);
      resetForm();
      
      // Close modal after success
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(false);
        setEditMode(false);
        setSelectedEvent(null);
      }, 1500);
    } catch (error) {
      console.error('Error submitting event:', error);
      console.error('Error details:', error.response?.data);
      setError(`Erreur lors de l'enregistrement de l'événement: ${error.response?.data?.error || error.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit event
  const handleEdit = (event) => {
    setSelectedEvent(event);
    setEditMode(true);
    setShowModal(true);
  };

  // Handle delete event
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await evenementService.delete(id);
        
        // Update the events list
        setEvents(prev => prev.filter(event => event.id !== id));
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Erreur lors de la suppression de l\'événement.');
      }
    }
  };

  // Handle view event details
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    
    // Here you could open a modal to show details
    // For now, we'll just log them
    console.log('Event details:', event);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="m-0 fs-5">Gestion des Événements</h3>
          <button 
            className="btn btn-light btn-sm" 
            onClick={() => {
              setEditMode(false);
              setSelectedEvent(null);
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Nouvel Événement
          </button>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="alert alert-info text-center">
              <i className="fas fa-info-circle me-2"></i>
              Aucun événement trouvé.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Date</th>
                    <th>Lieu</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="fw-medium">{event.name}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.location}</td>
                      <td>
                        {event.description.length > 100
                          ? `${event.description.substring(0, 100)}...`
                          : event.description}
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            className="btn btn-sm btn-info text-white" 
                            onClick={() => handleViewDetails(event)}
                            title="Voir détails"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-warning text-white" 
                            onClick={() => handleEdit(event)}
                            title="Modifier"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleDelete(event.id)}
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

      {/* Event Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editMode ? 'Modifier l\'événement' : 'Nouvel événement'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  aria-label="Close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {submitSuccess && (
                  <div className="alert alert-success" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    Événement {editMode ? 'modifié' : 'créé'} avec succès!
                  </div>
                )}

                <Formik
                  initialValues={{
                    name: selectedEvent?.name || '',
                    date: selectedEvent?.date ? new Date(selectedEvent.date).toISOString().split('T')[0] : '',
                    location: selectedEvent?.location || '',
                    description: selectedEvent?.description || ''
                  }}
                  validationSchema={eventSchema}
                  onSubmit={handleSubmit}
                  enableReinitialize={true}
                >
                  {({ errors, touched }) => (
                    <Form>
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">Nom de l'événement <span className="text-danger">*</span></label>
                        <Field
                          name="name"
                          type="text"
                          className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`}
                        />
                        <ErrorMessage name="name" component="div" className="invalid-feedback" />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="date" className="form-label">Date <span className="text-danger">*</span></label>
                        <Field
                          name="date"
                          type="date"
                          className={`form-control ${errors.date && touched.date ? 'is-invalid' : ''}`}
                        />
                        <ErrorMessage name="date" component="div" className="invalid-feedback" />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="location" className="form-label">Lieu <span className="text-danger">*</span></label>
                        <Field
                          name="location"
                          type="text"
                          className={`form-control ${errors.location && touched.location ? 'is-invalid' : ''}`}
                        />
                        <ErrorMessage name="location" component="div" className="invalid-feedback" />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
                        <Field
                          as="textarea"
                          name="description"
                          rows="4"
                          className={`form-control ${errors.description && touched.description ? 'is-invalid' : ''}`}
                        />
                        <ErrorMessage name="description" component="div" className="invalid-feedback" />
                      </div>

                      <div className="d-flex justify-content-end mt-4">
                        <button 
                          type="button" 
                          className="btn btn-secondary me-2" 
                          onClick={() => setShowModal(false)}
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
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              {editMode ? 'Mettre à jour' : 'Enregistrer'}
                            </>
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;