import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Badge, Table, Modal, Spinner } from 'react-bootstrap';
import axios from 'axios';
import '../../styles/ProcedureTracking.css';

const ProcedureTracking = () => {
  // États pour les données
  const [dossiers, setDossiers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    en_cours: 0,
    complete: 0
  });
  const [nouveauxDossiers, setNouveauxDossiers] = useState(0);
  const [specialites, setSpecialites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDossier, setSelectedDossier] = useState(null);

  // États pour les filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialiteFilter, setSpecialiteFilter] = useState('');
  const [sort, setSort] = useState('date_creation');
  const [order, setOrder] = useState('DESC');

  // États pour les modales
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResendLinkModal, setShowResendLinkModal] = useState(false);
  
  // États pour les formulaires
  const [commentaire, setCommentaire] = useState('');
  const [newDossierData, setNewDossierData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    nationalite: '',
    specialite: '',
    universite: '',
    diplome_pays: ''
  });
  const [confirmEnvoi, setConfirmEnvoi] = useState(false);
  const [confirmRenvoi, setConfirmRenvoi] = useState(false);

  // États pour les notifications et erreurs
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lienAccesGenere, setLienAccesGenere] = useState('');
  const [nomMedecin, setNomMedecin] = useState('');
  const [emailMedecin, setEmailMedecin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Définition des étapes et leur information
  const etapesInfo = {
    'nouveau': {
      titre: 'Dossier créé',
      couleur: 'primary',
      next_step: 'authentification'
    },
    'authentification': {
      titre: 'Authentification des diplômes',
      couleur: 'warning',
      next_step: 'homologation'
    },
    'homologation': {
      titre: 'Demande d\'homologation', 
      couleur: 'info',
      next_step: 'cnom'
    },
    'cnom': {
      titre: 'Enregistrement CNOM',
      couleur: 'purple',
      next_step: 'autorisation_exercer'
    },
    'autorisation_exercer': {
      titre: 'Autorisation d\'exercer',
      couleur: 'success',
      next_step: 'autorisation_travail'
    },
    'autorisation_travail': {
      titre: 'Autorisation de travail',
      couleur: 'success',
      next_step: null
    }
  };

  // Documents requis par étape
  const documentsRequis = {
    'nouveau': {
      'diplome': 'Diplôme de médecine (original et copie)',
      'piece_identite': 'Pièce d\'identité (passeport)',
      'releves_notes': 'Relevés de notes',
      'acte_naissance': 'Acte de naissance'
    },
    'authentification': {
      'diplome_authentifie': 'Diplômes authentifiés par l\'ambassade',
      'attestation_ambassade': 'Attestation d\'authentification',
      'traduction_officielle': 'Traduction officielle (si nécessaire)'
    },
    'homologation': {
      'diplome_legalise': 'Diplômes légalisés par l\'UOB',
      'diplome_legalise_mae': 'Diplômes légalisés par le MAE',
      'dossier_homologation': 'Dossier complet de demande d\'homologation'
    },
    'cnom': {
      'attestation_homologation': 'Attestation d\'homologation',
      'dossier_cnom': 'Dossier d\'enregistrement CNOM',
      'serment_hippocrate': 'Serment d\'Hippocrate'
    },
    'autorisation_exercer': {
      'numero_cnom': 'Numéro d\'enregistrement CNOM',
      'certificat_medical': 'Certificat médical de moins de 3 mois',
      'casier_judiciaire': 'Extrait de casier judiciaire',
      'photos_identite': 'Photos d\'identité récentes'
    },
    'autorisation_travail': {
      'autorisation_exercer': 'Autorisation d\'exercer délivrée',
      'contrat_travail': 'Contrat de travail signé',
      'certificat_hebergement': 'Certificat d\'hébergement',
      'engagement_rapatriement': 'Engagement de rapatriement'
    }
  };

  // Simuler le chargement des données du serveur
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Dans une véritable application, ceci serait remplacé par des appels d'API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler un délai réseau

        // Données fictives pour simulation
        const mockDossiers = [
          {
            id: '1',
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@example.com',
            telephone: '+33 6 12 34 56 78',
            nationalite: 'Française',
            specialite: 'Cardiologie',
            universite: 'Université Paris Descartes',
            diplome_pays: 'France',
            statut: 'authentification',
            date_creation: '2025-06-15',
            derniere_modification: '2025-06-17'
          },
          {
            id: '2',
            nom: 'Smith',
            prenom: 'John',
            email: 'john.smith@example.com',
            telephone: '+44 7911 123456',
            nationalite: 'Britannique',
            specialite: 'Neurologie',
            universite: 'Imperial College London',
            diplome_pays: 'Royaume-Uni',
            statut: 'homologation',
            date_creation: '2025-06-10',
            derniere_modification: '2025-06-16'
          },
          {
            id: '3',
            nom: 'Diallo',
            prenom: 'Mamadou',
            email: 'mamadou.diallo@example.com',
            telephone: '+221 77 123 45 67',
            nationalite: 'Sénégalaise',
            specialite: 'Pédiatrie',
            universite: 'Université Cheikh Anta Diop',
            diplome_pays: 'Sénégal',
            statut: 'nouveau',
            date_creation: '2025-06-20',
            derniere_modification: '2025-06-20'
          },
          {
            id: '4',
            nom: 'Morin',
            prenom: 'Sophie',
            email: 'sophie.morin@example.com',
            telephone: '+33 6 98 76 54 32',
            nationalite: 'Française',
            specialite: 'Radiologie',
            universite: 'Université Lyon 1',
            diplome_pays: 'France',
            statut: 'autorisation_travail',
            date_creation: '2025-05-05',
            derniere_modification: '2025-06-18'
          }
        ];

        // Stats fictives
        const mockStats = {
          total: mockDossiers.length,
          nouveau: mockDossiers.filter(d => d.statut === 'nouveau').length,
          en_cours: mockDossiers.filter(d => ['authentification', 'homologation', 'cnom', 'autorisation_exercer'].includes(d.statut)).length,
          complete: mockDossiers.filter(d => d.statut === 'autorisation_travail').length
        };

        // Simuler les nouveaux dossiers (dans les dernières 24h)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const nouveauxCount = mockDossiers.filter(d => new Date(d.date_creation) > yesterday).length;

        // Extraire les spécialités uniques
        const uniqueSpecialites = [...new Set(mockDossiers.map(d => d.specialite))];

        // Mettre à jour les états
        setDossiers(mockDossiers);
        setStats(mockStats);
        setNouveauxDossiers(nouveauxCount);
        setSpecialites(uniqueSpecialites);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setErrorMessage("Une erreur est survenue lors du chargement des données. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrer les dossiers en fonction des critères
  const filteredDossiers = dossiers.filter(dossier => {
    const matchesSearch = !search || 
      dossier.nom.toLowerCase().includes(search.toLowerCase()) ||
      dossier.prenom.toLowerCase().includes(search.toLowerCase()) ||
      dossier.email.toLowerCase().includes(search.toLowerCase()) ||
      dossier.specialite.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || dossier.statut === statusFilter;
    
    const matchesSpecialite = !specialiteFilter || dossier.specialite === specialiteFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialite;
  });

  // Trier les dossiers
  const sortedDossiers = [...filteredDossiers].sort((a, b) => {
    let valueA = a[sort];
    let valueB = b[sort];

    // Pour les chaînes, convertir en minuscules pour un tri insensible à la casse
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();

    if (order === 'ASC') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  // Vérifier si un dossier a été créé dans les dernières 24h
  const isNewDossier = (dateCreation) => {
    const now = new Date();
    const creationDate = new Date(dateCreation);
    const diffTime = Math.abs(now - creationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  // Fonction pour gérer le changement d'ordre de tri
  const handleSortChange = (column) => {
    if (sort === column) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSort(column);
      setOrder('ASC');
    }
  };

  // Simuler l'ajout d'un commentaire
  const handleAddComment = () => {
    if (!commentaire.trim()) {
      setErrorMessage("Le commentaire ne peut pas être vide.");
      return;
    }

    setIsSubmitting(true);

    // Simuler un appel API
    setTimeout(() => {
      console.log("Commentaire ajouté:", {
        dossier_id: selectedDossier.id,
        etape: "commentaire_general",
        commentaire: commentaire
      });
      
      setIsSubmitting(false);
      setCommentaire('');
      setShowCommentModal(false);
      setSuccessMessage("Commentaire ajouté avec succès");
      
      // Effacer le message après 5 secondes
      setTimeout(() => setSuccessMessage(''), 5000);
    }, 1000);
  };

  // Simuler la suppression d'un dossier
  const handleDeleteDossier = () => {
    setIsSubmitting(true);

    // Simuler un appel API
    setTimeout(() => {
      const updatedDossiers = dossiers.filter(d => d.id !== selectedDossier.id);
      
      setDossiers(updatedDossiers);
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setSuccessMessage("Dossier supprimé avec succès");
      
      // Mettre à jour les statistiques
      setStats({
        total: updatedDossiers.length,
        nouveau: updatedDossiers.filter(d => d.statut === 'nouveau').length,
        en_cours: updatedDossiers.filter(d => ['authentification', 'homologation', 'cnom', 'autorisation_exercer'].includes(d.statut)).length,
        complete: updatedDossiers.filter(d => d.statut === 'autorisation_travail').length
      });
      
      // Effacer le message après 5 secondes
      setTimeout(() => setSuccessMessage(''), 5000);
    }, 1000);
  };

  // Simuler la création d'un nouveau dossier
  const handleCreateDossier = (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!newDossierData.nom || !newDossierData.prenom || !newDossierData.email || !newDossierData.specialite) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    if (!confirmEnvoi) {
      setErrorMessage("Veuillez confirmer la création du dossier.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');

    // Simuler un appel API
    setTimeout(() => {
      // Créer un nouvel ID fictif
      const newId = (Math.max(...dossiers.map(d => parseInt(d.id))) + 1).toString();
      
      // Créer un nouveau dossier
      const newDossier = {
        id: newId,
        ...newDossierData,
        statut: 'nouveau',
        date_creation: new Date().toISOString().split('T')[0],
        derniere_modification: new Date().toISOString().split('T')[0]
      };
      
      // Mettre à jour l'état
      const updatedDossiers = [...dossiers, newDossier];
      setDossiers(updatedDossiers);
      
      // Générer un lien d'accès fictif
      const accessToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const lienAcces = `https://centre-diagnostic.com/acces_dossier.php?token=${accessToken}`;
      
      // Mettre à jour les états pour afficher le lien
      setLienAccesGenere(lienAcces);
      setNomMedecin(`${newDossierData.prenom} ${newDossierData.nom}`);
      setEmailMedecin(newDossierData.email);
      
      // Réinitialiser le formulaire
      setNewDossierData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        nationalite: '',
        specialite: '',
        universite: '',
        diplome_pays: ''
      });
      setConfirmEnvoi(false);
      
      // Fermer la modale
      setShowCreateModal(false);
      
      // Mettre à jour les statistiques
      setStats({
        total: updatedDossiers.length,
        nouveau: updatedDossiers.filter(d => d.statut === 'nouveau').length,
        en_cours: updatedDossiers.filter(d => ['authentification', 'homologation', 'cnom', 'autorisation_exercer'].includes(d.statut)).length,
        complete: updatedDossiers.filter(d => d.statut === 'autorisation_travail').length
      });
      
      setSuccessMessage("Dossier créé avec succès et email envoyé au médecin.");
      setIsSubmitting(false);
      
      // Effacer le lien après 1 minute
      setTimeout(() => {
        setLienAccesGenere('');
        setNomMedecin('');
        setEmailMedecin('');
      }, 60000);
    }, 1500);
  };

  // Simuler le renvoi d'un lien d'accès
  const handleResendLink = () => {
    if (!confirmRenvoi) {
      setErrorMessage("Veuillez confirmer l'envoi du nouveau lien d'accès.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');

    // Simuler un appel API
    setTimeout(() => {
      // Générer un nouveau token fictif
      const accessToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      console.log("Nouveau lien d'accès généré pour:", selectedDossier.id);
      
      setIsSubmitting(false);
      setConfirmRenvoi(false);
      setShowResendLinkModal(false);
      setSuccessMessage(`Un nouveau lien d'accès a été envoyé à ${selectedDossier.email}`);
      
      // Effacer le message après 5 secondes
      setTimeout(() => setSuccessMessage(''), 5000);
    }, 1000);
  };

  // Fonction pour copier le lien d'accès
  const copyLien = () => {
    navigator.clipboard.writeText(lienAccesGenere)
      .then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        if (copyBtn) {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fas fa-check me-1"></i>Copié!';
          copyBtn.classList.remove('btn-outline-primary');
          copyBtn.classList.add('btn-success');
          
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-outline-primary');
          }, 1500);
        }
      })
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
        setErrorMessage('Erreur lors de la copie du lien');
      });
  };

  // Fonction pour afficher les détails du dossier
  const viewDossier = (id) => {
    // Dans une application réelle, ceci redirigerait vers une page de détails
    console.log("Affichage des détails pour le dossier:", id);
    window.alert(`Cette fonction ouvrirait la page de détails du dossier #${id} dans une application réelle.`);
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    // Préparer les données
    const headers = ['ID', 'Nom', 'Email', 'Spécialité', 'Statut', 'Date de création'];
    
    const data = sortedDossiers.map(dossier => [
      dossier.id,
      `${dossier.prenom} ${dossier.nom}`,
      dossier.email,
      dossier.specialite,
      etapesInfo[dossier.statut].titre,
      new Date(dossier.date_creation).toLocaleDateString('fr-FR')
    ]);
    
    // Convertir en format CSV
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Préparer le téléchargement
    link.setAttribute('href', url);
    link.setAttribute('download', `dossiers_medicaux_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMessage('Export CSV réalisé avec succès');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="procedure-tracking-container">
      {/* Titre de la page */}
      <div className="page-title-wrapper">
        <h1 className="page-title">Suivi des Procédures Médicales</h1>
        <p className="page-subtitle">
          Gérez les dossiers d'homologation et les autorisations d'exercer des médecins
        </p>
      </div>

      {/* Messages de succès et d'erreur */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          <i className="fas fa-check-circle me-2"></i>{successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          <i className="fas fa-exclamation-triangle me-2"></i>{errorMessage}
        </Alert>
      )}

      {/* Lien d'accès généré */}
      {lienAccesGenere && (
        <Alert variant="info" dismissible onClose={() => {
          setLienAccesGenere('');
          setNomMedecin('');
          setEmailMedecin('');
        }}>
          <h5><i className="fas fa-link me-2"></i>Lien d'accès généré pour Dr. {nomMedecin}</h5>
          <p>Email: {emailMedecin}</p>
          <div className="input-group mb-2">
            <Form.Control
              type="text"
              value={lienAccesGenere}
              readOnly
              id="lien_acces"
            />
            <Button 
              variant="outline-primary" 
              className="copy-btn"
              onClick={copyLien}
            >
              <i className="fas fa-copy me-1"></i>Copier
            </Button>
          </div>
          <p className="mb-0">
            <Button 
              variant="primary" 
              size="sm" 
              href={lienAccesGenere} 
              target="_blank"
              className="me-2"
            >
              <i className="fas fa-external-link-alt me-1"></i>Ouvrir le lien
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                setLienAccesGenere('');
                setNomMedecin('');
                setEmailMedecin('');
              }}
            >
              <i className="fas fa-times me-1"></i>Fermer
            </Button>
          </p>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <i className="fas fa-folder-open"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Dossiers au total</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.complete}</div>
            <div className="stat-label">Dossiers complétés</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-orange">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.en_cours}</div>
            <div className="stat-label">Dossiers en cours</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-red">
            <i className="fas fa-plus-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{nouveauxDossiers}</div>
            <div className="stat-label">Nouveaux (24h)</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-4 filters-section">
        <Card.Body>
          <Form>
            <div className="row align-items-end">
              <div className="col-md-3 mb-3 mb-md-0">
                <Form.Label>Recherche</Form.Label>
                <div className="search-bar w-100 position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Nom, email, spécialité..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>
              </div>
              
              <div className="col-md-3 mb-3 mb-md-0">
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(etapesInfo).map(([key, etape]) => (
                    <option key={key} value={key}>
                      {etape.titre}
                    </option>
                  ))}
                </Form.Select>
              </div>
              
              <div className="col-md-3 mb-3 mb-md-0">
                <Form.Label>Spécialité</Form.Label>
                <Form.Select
                  value={specialiteFilter}
                  onChange={(e) => setSpecialiteFilter(e.target.value)}
                >
                  <option value="">Toutes les spécialités</option>
                  {specialites.map((specialite, index) => (
                    <option key={index} value={specialite}>
                      {specialite}
                    </option>
                  ))}
                </Form.Select>
              </div>
              
              <div className="col-md-3">
                <Button variant="primary" className="w-100" onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setSpecialiteFilter('');
                }}>
                  <i className="fas fa-filter me-2"></i>Réinitialiser les filtres
                </Button>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Liste des dossiers */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="card-title">
            <i className="fas fa-list me-2"></i>Liste des dossiers ({sortedDossiers.length})
          </div>
          <div>
            <Button
              variant="success"
              size="sm"
              className="me-2"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-user-plus me-1"></i>Nouveau dossier
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={exportToCSV}
            >
              <i className="fas fa-download me-1"></i>Exporter
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des données...</p>
            </div>
          ) : sortedDossiers.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-folder-open text-muted fa-2x mb-3"></i>
              <p className="text-muted">Aucun dossier ne correspond aux critères de recherche</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover striped>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('id')} style={{cursor: 'pointer'}}>
                      #ID <i className="fas fa-sort"></i>
                    </th>
                    <th>Médecin</th>
                    <th onClick={() => handleSortChange('specialite')} style={{cursor: 'pointer'}}>
                      Spécialité <i className="fas fa-sort"></i>
                    </th>
                    <th>Statut</th>
                    <th onClick={() => handleSortChange('date_creation')} style={{cursor: 'pointer'}}>
                      Date de création <i className="fas fa-sort"></i>
                    </th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDossiers.map((dossier) => {
                    const isNew = isNewDossier(dossier.date_creation);
                    const statusKey = dossier.statut || 'nouveau';
                    
                    return (
                      <tr key={dossier.id} className={isNew ? "validation-needed" : ""}>
                        <td>{dossier.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2"><i className="fas fa-user-md text-primary"></i></span>
                            <div>
                              <div className="fw-bold">{dossier.nom} {dossier.prenom}</div>
                              <small className="text-muted">{dossier.email}</small>
                            </div>
                            {isNew && <Badge bg="danger" className="ms-2">Nouveau</Badge>}
                          </div>
                        </td>
                        <td>{dossier.specialite}</td>
                        <td>
                          <Badge bg={etapesInfo[statusKey].couleur.replace('badge-', '')}>
                            {etapesInfo[statusKey].titre}
                          </Badge>
                        </td>
                        <td>{new Date(dossier.date_creation).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <span className="documents-indicator">
                            <i className="fas fa-exclamation-circle"></i> 0 document
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => viewDossier(dossier.id)}
                              title="Voir les détails"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="me-1"
                              onClick={() => {
                                setSelectedDossier(dossier);
                                setShowCommentModal(true);
                              }}
                              title="Ajouter un commentaire"
                            >
                              <i className="fas fa-comment"></i>
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1"
                              onClick={() => {
                                setSelectedDossier(dossier);
                                setShowResendLinkModal(true);
                              }}
                              title="Renvoyer lien d'accès"
                            >
                              <i className="fas fa-link"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setSelectedDossier(dossier);
                                setShowDeleteModal(true);
                              }}
                              title="Supprimer le dossier"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Ajouter Commentaire */}
      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)}>
        <Modal.Header>
          <Modal.Title>
            <i className="fas fa-comment-dots me-2"></i>
            Ajouter un commentaire
            {selectedDossier && ` pour ${selectedDossier.prenom} ${selectedDossier.nom}`}
          </Modal.Title>
          <Button variant="close" onClick={() => setShowCommentModal(false)} />
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Commentaire</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Saisissez votre commentaire sur ce dossier..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddComment}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Enregistrement...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Enregistrer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header className="bg-danger text-white">
          <Modal.Title>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Confirmation de suppression
          </Modal.Title>
          <Button variant="close" className="btn-close-white" onClick={() => setShowDeleteModal(false)} />
        </Modal.Header>
        <Modal.Body>
          {selectedDossier && (
            <>
              <p className="mb-3">
                Êtes-vous sûr de vouloir supprimer définitivement le dossier de <strong>{selectedDossier.prenom} {selectedDossier.nom}</strong> ? Cette action est irréversible.
              </p>
              <Alert variant="warning">
                <i className="fas fa-info-circle me-2"></i>
                La suppression entraînera l'effacement de tous les documents et historiques associés.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteDossier}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Suppression...
              </>
            ) : (
              <>
                <i className="fas fa-trash me-2"></i>
                Confirmer la suppression
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Création de Dossier */}
      <Modal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        size="lg"
      >
        <Modal.Header>
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i>
            Créer un dossier médecin
          </Modal.Title>
          <Button variant="close" onClick={() => setShowCreateModal(false)} />
        </Modal.Header>
        <Form onSubmit={handleCreateDossier}>
          <Modal.Body>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Créez un dossier pour un médecin. Un lien d'accès lui sera automatiquement envoyé par email.
            </Alert>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newDossierData.nom}
                    onChange={(e) => setNewDossierData({...newDossierData, nom: e.target.value})}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newDossierData.prenom}
                    onChange={(e) => setNewDossierData({...newDossierData, prenom: e.target.value})}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={newDossierData.email}
                    onChange={(e) => setNewDossierData({...newDossierData, email: e.target.value})}
                    required
                  />
                  <Form.Text className="text-muted">
                    Un lien d'accès sera envoyé à cette adresse
                  </Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={newDossierData.telephone}
                    onChange={(e) => setNewDossierData({...newDossierData, telephone: e.target.value})}
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Nationalité</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDossierData.nationalite}
                    onChange={(e) => setNewDossierData({...newDossierData, nationalite: e.target.value})}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Spécialité médicale <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newDossierData.specialite}
                    onChange={(e) => setNewDossierData({...newDossierData, specialite: e.target.value})}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Université/École de médecine</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDossierData.universite}
                    onChange={(e) => setNewDossierData({...newDossierData, universite: e.target.value})}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Pays du diplôme</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDossierData.diplome_pays}
                    onChange={(e) => setNewDossierData({...newDossierData, diplome_pays: e.target.value})}
                  />
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="confirmEnvoi"
                label="Je confirme la création du dossier et l'envoi d'un email au médecin *"
                checked={confirmEnvoi}
                onChange={(e) => setConfirmEnvoi(e.target.checked)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="success" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Création en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Créer le dossier et envoyer l'invitation
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Renvoyer Lien */}
      <Modal show={showResendLinkModal} onHide={() => setShowResendLinkModal(false)}>
        <Modal.Header>
          <Modal.Title>
            <i className="fas fa-link me-2"></i>
            Renvoyer un lien d'accès
          </Modal.Title>
          <Button variant="close" onClick={() => setShowResendLinkModal(false)} />
        </Modal.Header>
        <Modal.Body>
          {selectedDossier && (
            <>
              <Alert variant="info">
                <i className="fas fa-info-circle me-2"></i>
                Vous êtes sur le point de générer un nouveau lien d'accès pour Dr. {selectedDossier.prenom} {selectedDossier.nom}.
                Un email lui sera automatiquement envoyé avec ce lien.
                <br />
                <strong>Email:</strong> {selectedDossier.email}
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="confirmRenvoi"
                  label="Je confirme l'envoi d'un nouveau lien d'accès au médecin"
                  checked={confirmRenvoi}
                  onChange={(e) => setConfirmRenvoi(e.target.checked)}
                  required
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResendLinkModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="success" 
            onClick={handleResendLink}
            disabled={!confirmRenvoi || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Envoi en cours...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Envoyer le nouveau lien
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProcedureTracking;