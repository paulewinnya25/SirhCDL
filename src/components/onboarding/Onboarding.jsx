import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    employeeInfo: {
      matricule: '',
      nom_prenom: '',
      genre: 'Homme',
      date_naissance: '',
      lieu_naissance: '',
      nationalite: 'Gabon',
      situation_maritale: 'Célibataire',
      nbr_enfants: 0,
      adresse: '',
      telephone: '',
      email: '',
      cnss_number: '',
      cnamgs_number: ''
    },
    professionalInfo: {
      poste_actuel: '',
      domaine_fonctionnel: '',
      entity: '',
      departement: '',
      type_contrat: '',
      date_entree: '',
      date_fin_contrat: '',
      salaire_base: '',
      salaire_propose: '',
      source_recrutement: '',
      categorie: '',
      responsable: '',
      niveau_etude: '',
      specialisation: ''
    },
    documents: [],
    checklist: {
      contrat_signature: false,
      documents_verifies: false,
      acces_configure: false,
      formation_initiale: false,
      presentation_equipe: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const steps = [
    { 
      id: 1, 
      title: '📋 Informations personnelles', 
      description: 'Données de base et coordonnées',
      icon: 'fas fa-user'
    },
    { 
      id: 2, 
      title: '💼 Informations professionnelles', 
      description: 'Poste, contrat et rémunération',
      icon: 'fas fa-briefcase'
    },
    { 
      id: 3, 
      title: '📁 Documents requis', 
      description: 'Téléchargement des documents',
      icon: 'fas fa-file-upload'
    },
    { 
      id: 4, 
      title: '✅ Checklist d\'intégration', 
      description: 'Procédures d\'accueil',
      icon: 'fas fa-tasks'
    },
    { 
      id: 5, 
      title: '🎯 Validation finale', 
      description: 'Récapitulatif et finalisation',
      icon: 'fas fa-check-circle'
    }
  ];

  // Générer un matricule automatique
  useEffect(() => {
    if (!formData.employeeInfo.matricule) {
      const generateMatricule = () => {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `EMP${year}${random}`;
      };
      setFormData(prev => ({
        ...prev,
        employeeInfo: {
          ...prev.employeeInfo,
          matricule: generateMatricule()
        }
      }));
    }
  }, []);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleChecklistChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [field]: checked
      }
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files.map(file => ({
        file,
        type: file.name.split('.').pop(),
        name: file.name,
        size: file.size
      }))]
    }));
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.employeeInfo.nom_prenom && 
               formData.employeeInfo.email && 
               formData.employeeInfo.telephone;
      case 2:
        return formData.professionalInfo.poste_actuel && 
               formData.professionalInfo.type_contrat && 
               formData.professionalInfo.date_entree;
      case 3:
        return formData.documents.length > 0;
      case 4:
        return Object.values(formData.checklist).some(Boolean);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Créer un FormData pour l'envoi
      const submitData = new FormData();
      
      // Ajouter les données de base
      submitData.append('employeeData', JSON.stringify({
        ...formData.employeeInfo,
        ...formData.professionalInfo,
        checklist: formData.checklist
      }));
      
      // Ajouter les documents
      formData.documents.forEach((doc, index) => {
        submitData.append('documents', doc.file);
        submitData.append('documentTypes', doc.type);
      });

      // Appel API (à adapter selon votre backend)
      const response = await axios.post('/api/employees/onboarding', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/employees');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'onboarding');
      }
    } catch (err) {
      console.error('Erreur onboarding:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'onboarding. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3><i className="fas fa-user"></i> Informations personnelles</h3>
        <p>Renseignez les informations de base du nouvel employé</p>
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="matricule">Matricule *</label>
          <input
            type="text"
            id="matricule"
            value={formData.employeeInfo.matricule}
            onChange={(e) => handleInputChange('employeeInfo', 'matricule', e.target.value)}
            required
            readOnly
            className="form-control readonly"
          />
          <small>Généré automatiquement</small>
        </div>

        <div className="form-group">
          <label htmlFor="nom_prenom">Nom et prénom *</label>
          <input
            type="text"
            id="nom_prenom"
            value={formData.employeeInfo.nom_prenom}
            onChange={(e) => handleInputChange('employeeInfo', 'nom_prenom', e.target.value)}
            required
            placeholder="Nom et prénom complet"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Genre *</label>
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="genre"
                value="Homme"
                checked={formData.employeeInfo.genre === 'Homme'}
                onChange={(e) => handleInputChange('employeeInfo', 'genre', e.target.value)}
              />
              <span>Homme</span>
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="genre"
                value="Femme"
                checked={formData.employeeInfo.genre === 'Femme'}
                onChange={(e) => handleInputChange('employeeInfo', 'genre', e.target.value)}
              />
              <span>Femme</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="date_naissance">Date de naissance *</label>
          <input
            type="date"
            id="date_naissance"
            value={formData.employeeInfo.date_naissance}
            onChange={(e) => handleInputChange('employeeInfo', 'date_naissance', e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lieu_naissance">Lieu de naissance</label>
          <input
            type="text"
            id="lieu_naissance"
            value={formData.employeeInfo.lieu_naissance}
            onChange={(e) => handleInputChange('employeeInfo', 'lieu_naissance', e.target.value)}
            placeholder="Ville, pays"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="nationalite">Nationalité</label>
          <select
            id="nationalite"
            value={formData.employeeInfo.nationalite}
            onChange={(e) => handleInputChange('employeeInfo', 'nationalite', e.target.value)}
            className="form-control"
          >
            <option value="Gabon">Gabon</option>
            <option value="Cameroun">Cameroun</option>
            <option value="Congo">Congo</option>
            <option value="RDC">RDC</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="situation_maritale">Situation maritale</label>
          <select
            id="situation_maritale"
            value={formData.employeeInfo.situation_maritale}
            onChange={(e) => handleInputChange('employeeInfo', 'situation_maritale', e.target.value)}
            className="form-control"
          >
            <option value="Célibataire">Célibataire</option>
            <option value="Marié(e)">Marié(e)</option>
            <option value="Divorcé(e)">Divorcé(e)</option>
            <option value="Veuf/Veuve">Veuf/Veuve</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="nbr_enfants">Nombre d'enfants</label>
          <input
            type="number"
            id="nbr_enfants"
            value={formData.employeeInfo.nbr_enfants}
            onChange={(e) => handleInputChange('employeeInfo', 'nbr_enfants', parseInt(e.target.value) || 0)}
            min="0"
            className="form-control"
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="adresse">Adresse complète</label>
          <textarea
            id="adresse"
            value={formData.employeeInfo.adresse}
            onChange={(e) => handleInputChange('employeeInfo', 'adresse', e.target.value)}
            placeholder="Adresse complète"
            rows="3"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="telephone">Téléphone *</label>
          <input
            type="tel"
            id="telephone"
            value={formData.employeeInfo.telephone}
            onChange={(e) => handleInputChange('employeeInfo', 'telephone', e.target.value)}
            required
            placeholder="+241 XX XX XX XX"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            value={formData.employeeInfo.email}
            onChange={(e) => handleInputChange('employeeInfo', 'email', e.target.value)}
            required
            placeholder="email@exemple.com"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="cnss_number">Numéro CNSS</label>
          <input
            type="text"
            id="cnss_number"
            value={formData.employeeInfo.cnss_number}
            onChange={(e) => handleInputChange('employeeInfo', 'cnss_number', e.target.value)}
            placeholder="Numéro CNSS"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="cnamgs_number">Numéro CNAMGS</label>
          <input
            type="text"
            id="cnamgs_number"
            value={formData.employeeInfo.cnamgs_number}
            onChange={(e) => handleInputChange('employeeInfo', 'cnamgs_number', e.target.value)}
            placeholder="Numéro CNAMGS"
            className="form-control"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3><i className="fas fa-briefcase"></i> Informations professionnelles</h3>
        <p>Détails du poste, du contrat et de la rémunération</p>
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="poste_actuel">Poste actuel *</label>
          <input
            type="text"
            id="poste_actuel"
            value={formData.professionalInfo.poste_actuel}
            onChange={(e) => handleInputChange('professionalInfo', 'poste_actuel', e.target.value)}
            required
            placeholder="Intitulé du poste"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="domaine_fonctionnel">Domaine fonctionnel</label>
          <select
            id="domaine_fonctionnel"
            value={formData.professionalInfo.domaine_fonctionnel}
            onChange={(e) => handleInputChange('professionalInfo', 'domaine_fonctionnel', e.target.value)}
            className="form-control"
          >
            <option value="">Sélectionner un domaine</option>
            <option value="Clinique">Clinique</option>
            <option value="Accueil/Facturation">Accueil/Facturation</option>
            <option value="Laboratoire">Laboratoire</option>
            <option value="Informatique">Informatique</option>
            <option value="Administration">Administration</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="RH">Ressources Humaines</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="entity">Entité</label>
          <select
            id="entity"
            value={formData.professionalInfo.entity}
            onChange={(e) => handleInputChange('professionalInfo', 'entity', e.target.value)}
            className="form-control"
          >
            <option value="">Sélectionner une entité</option>
            <option value="CDL">Centre Diagnostic</option>
            <option value="Optikah">Optikah</option>
            <option value="Centre Wellness">Centre Wellness</option>
            <option value="Café Walhya">Café Walhya</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="departement">Département</label>
          <input
            type="text"
            id="departement"
            value={formData.professionalInfo.departement}
            onChange={(e) => handleInputChange('professionalInfo', 'departement', e.target.value)}
            placeholder="Ex: IT, RH, Finance"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type_contrat">Type de contrat *</label>
          <select
            id="type_contrat"
            value={formData.professionalInfo.type_contrat}
            onChange={(e) => handleInputChange('professionalInfo', 'type_contrat', e.target.value)}
            required
            className="form-control"
          >
            <option value="">Sélectionner un type</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Prestataire">Prestataire</option>
            <option value="Stage">Stage</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date_entree">Date d'entrée *</label>
          <input
            type="date"
            id="date_entree"
            value={formData.professionalInfo.date_entree}
            onChange={(e) => handleInputChange('professionalInfo', 'date_entree', e.target.value)}
            required
            className="form-control"
          />
        </div>

        {formData.professionalInfo.type_contrat !== 'CDI' && (
          <div className="form-group">
            <label htmlFor="date_fin_contrat">Date de fin de contrat</label>
            <input
              type="date"
              id="date_fin_contrat"
              value={formData.professionalInfo.date_fin_contrat}
              onChange={(e) => handleInputChange('professionalInfo', 'date_fin_contrat', e.target.value)}
              className="form-control"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="salaire_base">Salaire de base</label>
          <input
            type="number"
            id="salaire_base"
            value={formData.professionalInfo.salaire_base}
            onChange={(e) => handleInputChange('professionalInfo', 'salaire_base', e.target.value)}
            placeholder="Montant en FCFA"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="categorie">Catégorie</label>
          <select
            id="categorie"
            value={formData.professionalInfo.categorie}
            onChange={(e) => handleInputChange('professionalInfo', 'categorie', e.target.value)}
            className="form-control"
          >
            <option value="">Sélectionner une catégorie</option>
            <option value="Cadre">Cadre</option>
            <option value="Agent de maîtrise">Agent de maîtrise</option>
            <option value="Employé">Employé</option>
            <option value="Ouvrier">Ouvrier</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="responsable">Responsable hiérarchique</label>
          <input
            type="text"
            id="responsable"
            value={formData.professionalInfo.responsable}
            onChange={(e) => handleInputChange('professionalInfo', 'responsable', e.target.value)}
            placeholder="Nom du responsable"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="niveau_etude">Niveau d'étude</label>
          <select
            id="niveau_etude"
            value={formData.professionalInfo.niveau_etude}
            onChange={(e) => handleInputChange('professionalInfo', 'niveau_etude', e.target.value)}
            className="form-control"
          >
            <option value="">Sélectionner un niveau</option>
            <option value="Bac">Bac</option>
            <option value="Bac+2">Bac+2</option>
            <option value="Bac+3">Bac+3</option>
            <option value="Bac+4">Bac+4</option>
            <option value="Bac+5">Bac+5</option>
            <option value="Bac+8">Bac+8</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="specialisation">Spécialisation</label>
          <input
            type="text"
            id="specialisation"
            value={formData.professionalInfo.specialisation}
            onChange={(e) => handleInputChange('professionalInfo', 'specialisation', e.target.value)}
            placeholder="Domaine de spécialisation"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="salaire_propose">Salaire proposé (optionnel)</label>
          <input
            type="number"
            id="salaire_propose"
            value={formData.professionalInfo.salaire_propose}
            onChange={(e) => handleInputChange('professionalInfo', 'salaire_propose', e.target.value)}
            placeholder="Montant en FCFA"
            min="0"
            step="1000"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="source_recrutement">Source de recrutement</label>
          <select
            id="source_recrutement"
            value={formData.professionalInfo.source_recrutement}
            onChange={(e) => handleInputChange('professionalInfo', 'source_recrutement', e.target.value)}
            className="form-control"
          >
            <option value="">Sélectionner une source</option>
            <option value="Onboarding direct">Onboarding direct</option>
            <option value="Candidature spontanée">Candidature spontanée</option>
            <option value="Recrutement externe">Recrutement externe</option>
            <option value="Promotion interne">Promotion interne</option>
            <option value="Recommandation">Recommandation</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3><i className="fas fa-file-upload"></i> Documents requis</h3>
        <p>Téléchargez les documents nécessaires pour l'intégration</p>
      </div>
      
      <div className="documents-section">
        <div className="document-upload-area">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            id="file-upload"
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-label">
            <i className="fas fa-cloud-upload-alt"></i>
            <span>Cliquez pour sélectionner des fichiers</span>
            <small>Formats acceptés: PDF, DOC, DOCX, JPG, PNG</small>
          </label>
        </div>

        {formData.documents.length > 0 && (
          <div className="documents-list">
            <h4>Documents sélectionnés ({formData.documents.length})</h4>
            {formData.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <div className="document-info">
                  <i className="fas fa-file"></i>
                  <span className="document-name">{doc.name}</span>
                  <span className="document-size">({(doc.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="remove-document"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="required-documents">
          <h4>Documents obligatoires</h4>
          <ul>
            <li><i className="fas fa-check"></i> CV/Resume</li>
            <li><i className="fas fa-check"></i> Lettre de motivation</li>
            <li><i className="fas fa-check"></i> Copie de la carte d'identité</li>
            <li><i className="fas fa-check"></i> Diplômes et certificats</li>
            <li><i className="fas fa-check"></i> Attestation de travail (si applicable)</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3><i className="fas fa-tasks"></i> Checklist d'intégration</h3>
        <p>Cochez les éléments qui ont été réalisés</p>
      </div>
      
      <div className="checklist-section">
        <div className="checklist-grid">
          <label className="checklist-item">
            <input
              type="checkbox"
              checked={formData.checklist.contrat_signature}
              onChange={(e) => handleChecklistChange('contrat_signature', e.target.checked)}
            />
            <span className="checkmark"></span>
            <div className="checklist-content">
              <h4>Signature du contrat</h4>
              <p>Contrat de travail signé par les deux parties</p>
            </div>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={formData.checklist.documents_verifies}
              onChange={(e) => handleChecklistChange('documents_verifies', e.target.checked)}
            />
            <span className="checkmark"></span>
            <div className="checklist-content">
              <h4>Vérification des documents</h4>
              <p>Tous les documents requis ont été vérifiés</p>
            </div>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={formData.checklist.acces_configure}
              onChange={(e) => handleChecklistChange('acces_configure', e.target.checked)}
            />
            <span className="checkmark"></span>
            <div className="checklist-content">
              <h4>Configuration des accès</h4>
              <p>Accès informatique, badges et clés configurés</p>
            </div>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={formData.checklist.formation_initiale}
              onChange={(e) => handleChecklistChange('formation_initiale', e.target.checked)}
            />
            <span className="checkmark"></span>
            <div className="checklist-content">
              <h4>Formation initiale</h4>
              <p>Formation sur les procédures et outils</p>
            </div>
          </label>

          <label className="checklist-item">
            <input
              type="checkbox"
              checked={formData.checklist.presentation_equipe}
              onChange={(e) => handleChecklistChange('presentation_equipe', e.target.checked)}
            />
            <span className="checkmark"></span>
            <div className="checklist-content">
              <h4>Présentation à l'équipe</h4>
              <p>Présentation officielle au sein de l'équipe</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3><i className="fas fa-check-circle"></i> Validation finale</h3>
        <p>Vérifiez toutes les informations avant finalisation</p>
      </div>
      
      <div className="summary-section">
        <div className="summary-grid">
          <div className="summary-card">
            <h4><i className="fas fa-user"></i> Informations personnelles</h4>
            <div className="summary-content">
              <p><strong>Matricule:</strong> {formData.employeeInfo.matricule}</p>
              <p><strong>Nom:</strong> {formData.employeeInfo.nom_prenom}</p>
              <p><strong>Email:</strong> {formData.employeeInfo.email}</p>
              <p><strong>Téléphone:</strong> {formData.employeeInfo.telephone}</p>
            </div>
          </div>

          <div className="summary-card">
            <h4><i className="fas fa-briefcase"></i> Informations professionnelles</h4>
            <div className="summary-content">
              <p><strong>Poste:</strong> {formData.professionalInfo.poste_actuel}</p>
              <p><strong>Type de contrat:</strong> {formData.professionalInfo.type_contrat}</p>
              <p><strong>Date d'entrée:</strong> {formData.professionalInfo.date_entree}</p>
              <p><strong>Entité:</strong> {formData.professionalInfo.entity}</p>
            </div>
          </div>

          <div className="summary-card">
            <h4><i className="fas fa-file"></i> Documents</h4>
            <div className="summary-content">
              <p><strong>Nombre de documents:</strong> {formData.documents.length}</p>
              {formData.documents.map((doc, index) => (
                <p key={index}><i className="fas fa-file"></i> {doc.name}</p>
              ))}
            </div>
          </div>

          <div className="summary-card">
            <h4><i className="fas fa-tasks"></i> Checklist</h4>
            <div className="summary-content">
              {Object.entries(formData.checklist).map(([key, value]) => (
                <p key={key}>
                  <i className={`fas ${value ? 'fa-check text-success' : 'fa-times text-danger'}`}></i>
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="final-actions">
          <button
            type="button"
            onClick={handlePrevious}
            className="btn btn-secondary"
            disabled={loading}
          >
            <i className="fas fa-arrow-left"></i> Précédent
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Traitement...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> Finaliser l'onboarding
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  if (success) {
    return (
      <div className="onboarding-success">
        <div className="success-content">
          <i className="fas fa-check-circle"></i>
          <h2>Onboarding terminé avec succès !</h2>
          <p>L'employé a été intégré avec succès dans le système.</p>
          <p>Redirection vers la liste des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <h1><i className="fas fa-user-plus"></i> Processus d'Onboarding</h1>
        <p>Intégration d'un nouvel employé dans l'organisation</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      <div className="onboarding-progress">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
            >
              <div className="step-number">
                {currentStep > step.id ? (
                  <i className="fas fa-check"></i>
                ) : (
                  step.id
                )}
              </div>
              <div className="step-info">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding-content">
        {renderCurrentStep()}
      </div>

      {currentStep < 5 && (
        <div className="onboarding-navigation">
          <button
            type="button"
            onClick={handlePrevious}
            className="btn btn-secondary"
            disabled={currentStep === 1}
          >
            <i className="fas fa-arrow-left"></i> Précédent
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
            disabled={!validateStep(currentStep)}
          >
            Suivant <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;

