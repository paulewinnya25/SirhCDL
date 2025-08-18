import React from 'react';
import '../../styles/Dashboard.css';

const EventCard = ({ events, isLoading }) => {
  return (
    <div className="card event-card">
      <div className="card-header">
        <div className="card-icon">
          <i className="fas fa-calendar-week"></i>
        </div>
        <h3 className="card-title">Évènements de la Semaine</h3>
      </div>
      <div className="card-body">
        <div className="event-decoration decoration-1"></div>
        <div className="event-decoration decoration-2"></div>
        
        {isLoading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : events && events.length > 0 ? (
          <ul className="event-list">
            {events.map((event) => (
              <li key={event.id} className="event-item">
                <div className="event-meta">
                  <span className="event-meta-date">
                    <i className="far fa-calendar-alt"></i> {event.formatted_date}
                  </span>
                  <span className="event-meta-location">
                    <i className="fas fa-map-marker-alt"></i> {event.location}
                  </span>
                </div>
                <h4 className="event-name">{event.name}</h4>
                <p className="event-description">{event.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-events">
            <i className="far fa-calendar-times empty-icon"></i>
            <p className="empty-text">Aucun évènement prévu cette semaine.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;