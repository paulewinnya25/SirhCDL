import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import './AIBackgroundPanel.css';

const AIBackgroundPanel = ({ isVisible, onClose, conversationHistory, currentQuery }) => {
  const [aiStats, setAiStats] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isVisible && currentQuery) {
      analyzeCurrentQuery();
    }
  }, [isVisible, currentQuery]);

  useEffect(() => {
    if (isVisible) {
      updateAIStats();
    }
  }, [isVisible, conversationHistory]);

  const analyzeCurrentQuery = async () => {
    if (!currentQuery) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await aiService.generateResponse(currentQuery, conversationHistory);
      setCurrentAnalysis(analysis);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateAIStats = () => {
    const stats = aiService.getUsageStats();
    setAiStats(stats);
  };

  const handleFeedback = (quality) => {
    if (currentAnalysis && currentQuery) {
      aiService.learnFromInteraction(currentQuery, 'user_feedback', quality);
      updateAIStats();
    }
  };

  const resetAI = () => {
    aiService.reset();
    updateAIStats();
    setCurrentAnalysis(null);
  };

  if (!isVisible) return null;

  return (
    <div className="ai-background-panel">
      <div className="ai-panel-header">
        <h3>🧠 Intelligence Artificielle Wally</h3>
        <button className="ai-close-btn" onClick={onClose}>
          <span>×</span>
        </button>
      </div>

      <div className="ai-panel-content">
        {/* Analyse en temps réel */}
        <div className="ai-analysis-section">
          <h4>📊 Analyse en Temps Réel</h4>
          {isAnalyzing ? (
            <div className="ai-loading">
              <div className="ai-spinner"></div>
              <span>Analyse en cours...</span>
            </div>
          ) : currentAnalysis ? (
            <div className="ai-analysis-results">
              <div className="ai-confidence-bar">
                <span>Confiance IA:</span>
                <div className="confidence-progress">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${currentAnalysis.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="confidence-value">
                  {Math.round(currentAnalysis.confidence * 100)}%
                </span>
              </div>

              <div className="ai-intent-detection">
                <span className="ai-label">Intention détectée:</span>
                <span className="ai-value intent-badge">
                  {getIntentLabel(currentAnalysis.context.intent)}
                </span>
              </div>

              <div className="ai-sentiment">
                <span className="ai-label">Sentiment:</span>
                <span className={`ai-value sentiment-badge ${currentAnalysis.context.sentiment}`}>
                  {getSentimentLabel(currentAnalysis.context.sentiment)}
                </span>
              </div>

              <div className="ai-urgency">
                <span className="ai-label">Urgence:</span>
                <span className={`ai-value urgency-badge ${currentAnalysis.context.urgency}`}>
                  {getUrgencyLabel(currentAnalysis.context.urgency)}
                </span>
              </div>

              {currentAnalysis.context.entities.dates.length > 0 && (
                <div className="ai-entities">
                  <span className="ai-label">Dates détectées:</span>
                  <div className="entity-tags">
                    {currentAnalysis.context.entities.dates.map((date, index) => (
                      <span key={index} className="entity-tag date-tag">{date}</span>
                    ))}
                  </div>
                </div>
              )}

              {currentAnalysis.context.entities.departments.length > 0 && (
                <div className="ai-entities">
                  <span className="ai-label">Départements:</span>
                  <div className="entity-tags">
                    {currentAnalysis.context.entities.departments.map((dept, index) => (
                      <span key={index} className="entity-tag dept-tag">{dept}</span>
                    ))}
                  </div>
                </div>
              )}

              {currentAnalysis.suggestions.length > 0 && (
                <div className="ai-suggestions">
                  <span className="ai-label">Suggestions IA:</span>
                  <div className="suggestion-list">
                    {currentAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="suggestion-item">
                        <span className="suggestion-icon">💡</span>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentAnalysis.followUp && (
                <div className="ai-followup">
                  <span className="ai-label">Suivi suggéré:</span>
                  <div className="followup-text">{currentAnalysis.followUp}</div>
                </div>
              )}

              <div className="ai-feedback">
                <span className="ai-label">Évaluer cette réponse:</span>
                <div className="feedback-buttons">
                  <button 
                    className="feedback-btn good" 
                    onClick={() => handleFeedback('good')}
                    title="Bonne réponse"
                  >
                    👍
                  </button>
                  <button 
                    className="feedback-btn neutral" 
                    onClick={() => handleFeedback('neutral')}
                    title="Réponse moyenne"
                  >
                    😐
                  </button>
                  <button 
                    className="feedback-btn bad" 
                    onClick={() => handleFeedback('bad')}
                    title="Mauvaise réponse"
                  >
                    👎
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ai-no-analysis">
              <span>Parlez pour voir l'analyse IA</span>
            </div>
          )}
        </div>

        {/* Statistiques d'utilisation */}
        {aiStats && (
          <div className="ai-stats-section">
            <h4>📈 Statistiques IA</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total interactions</span>
                <span className="stat-value">{aiStats.totalInteractions}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Type utilisateur</span>
                <span className="stat-value">{getUserTypeLabel(aiStats.userType)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Confiance moyenne</span>
                <span className="stat-value">{Math.round(aiStats.averageConfidence * 100)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Dernière interaction</span>
                <span className="stat-value">
                  {aiStats.lastInteraction ? 
                    new Date(aiStats.lastInteraction).toLocaleTimeString('fr-FR') : 
                    'Aucune'
                  }
                </span>
              </div>
            </div>

            {aiStats.preferredTopics.length > 0 && (
              <div className="preferred-topics">
                <span className="ai-label">Sujets préférés:</span>
                <div className="topic-tags">
                  {aiStats.preferredTopics.map((topic, index) => (
                    <span key={index} className="topic-tag">
                      {getIntentLabel(topic)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contrôles avancés */}
        <div className="ai-controls-section">
          <button 
            className="ai-toggle-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Masquer' : 'Afficher'} les contrôles avancés
          </button>

          {showAdvanced && (
            <div className="advanced-controls">
              <button className="ai-reset-btn" onClick={resetAI}>
                🔄 Réinitialiser l'IA
              </button>
              <button className="ai-export-btn" onClick={() => exportAIData()}>
                📤 Exporter les données
              </button>
              <button className="ai-import-btn" onClick={() => importAIData()}>
                📥 Importer des données
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires
const getIntentLabel = (intent) => {
  const labels = {
    'leave_request': 'Demande de congé',
    'salary_info': 'Information salariale',
    'training_request': 'Demande de formation',
    'help_request': 'Demande d\'aide',
    'procedure_info': 'Information procédure',
    'policy_info': 'Information politique',
    'navigation': 'Navigation',
    'greeting': 'Salutation',
    'gratitude': 'Remerciement',
    'farewell': 'Au revoir',
    'general_inquiry': 'Question générale'
  };
  return labels[intent] || intent;
};

const getSentimentLabel = (sentiment) => {
  const labels = {
    'positive': 'Positif',
    'negative': 'Négatif',
    'neutral': 'Neutre'
  };
  return labels[sentiment] || sentiment;
};

const getUrgencyLabel = (urgency) => {
  const labels = {
    'high': 'Élevée',
    'medium': 'Moyenne',
    'low': 'Faible'
  };
  return labels[urgency] || urgency;
};

const getUserTypeLabel = (userType) => {
  const labels = {
    'hr_user': 'Utilisateur RH',
    'technical_user': 'Utilisateur technique',
    'new_user': 'Nouvel utilisateur',
    'general_user': 'Utilisateur général'
  };
  return labels[userType] || userType;
};

const exportAIData = () => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      aiStats: aiService.getUsageStats(),
      userPreferences: aiService.userPreferences
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wally-ai-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
  }
};

const importAIData = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          console.log('Données IA importées:', data);
          // Ici vous pourriez implémenter la logique d'import
        } catch (error) {
          console.error('Erreur lors de l\'import:', error);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

export default AIBackgroundPanel;




