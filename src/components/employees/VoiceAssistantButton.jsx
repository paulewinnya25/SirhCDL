import React, { useState } from 'react';
import ModernVoiceAssistant from './ModernVoiceAssistant';

const VoiceAssistantButton = ({ user }) => {
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);

  return (
    <>
      {/* Bouton flottant de l'assistant vocal africain */}
      <div className="voice-assistant-button">
        <button
          className="voice-fab"
          onClick={() => setShowVoiceAgent(true)}
          title="Wally - Assistant RH Africain"
        >
          <span className="fab-icon">🎤</span>
          <div className="pulse-ring"></div>
        </button>
        
        {/* Indicateur de statut */}
        <div className="voice-status-indicator">
          <div className="status-dot ready"></div>
        </div>
      </div>

      {/* Modal de l'agent vocal africain */}
      {showVoiceAgent && (
        <ModernVoiceAssistant
          user={user}
          onClose={() => setShowVoiceAgent(false)}
        />
      )}
    </>
  );
};

export default VoiceAssistantButton;
