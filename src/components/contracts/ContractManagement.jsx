import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { contratService } from '../../services/api';
import { employeeService } from '../../services/api';
import '../../styles/Tables.css';
import '../../styles/Forms.css';

const ContractManagement = () => {
  // États principaux
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contrats, setContrats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContrat, setSelectedContrat] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [contractFile, setContractFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterService, setFilterService] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date_debut', direction: 'desc' });

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
    byType: {}
  });

  // Validation schema pour le formulaire de contrat
  const contratSchema = Yup.object().shape({
    employee_id: Yup.string().required('L\'employé est requis'),
    nom_employe: Yup.string().required('L\'employé est requis'),
    type_contrat: Yup.string().required('Le type de contrat est requis'),
    date_debut: Yup.date().required('La date de début est requise'),
    date_fin: Yup.date()
      .nullable()
      .test('conditionally-required', 'La date de fin est requise pour ce type de contrat', function (value) {
        if (this.parent.type_contrat && this.parent.type_contrat !== 'CDI') {
          return value !== null && value !== undefined && value !== '';
        }
        return true;
      })
      .test('date-min', 'La date de fin doit être postérieure à la date de début', function (value) {
        const { date_debut } = this.parent;
        if (value && date_debut) {
          return new Date(value) > new Date(date_debut);
        }
        return true;
      }),
    poste: Yup.string().required('Le poste est requis'),
    service: Yup.string().required('Le service est requis'),
    salaire: Yup.number()
      .typeError('Le salaire doit être un nombre')
      .required('Le salaire est requis')
      .positive('Le salaire doit être positif'),
    periode_essai: Yup.number()
      .typeError('La période d\'essai doit être un nombre')
      .integer('La période d\'essai doit être un nombre entier')
      .min(0, 'La période d\'essai ne peut pas être négative')
  });

  // Types de contrat
  const contractTypes = [
    'CDI',
    'CDD',
    'Prestataire',
    'Stage',
    'Stage PNPE'
  ];

  // Services
  const services = [
    'Administration',
    'Agent d\'accueil et facturation',
    'Agent centre d\'appels',
    'Agent d\'entretien',
    'Agent de saisie et cotation',
    'Assistante comptable',
    'Assistante dentaire',
    'Biologiste',
    'Brancardier',
    'Coursier',
    'Cuisinier',
    'Infirmier(ère)',
    'Médecin généraliste',
    'Médecin Radiologue',
    'Sage-femme',
    'Secrétaire médicale',
    'Technicien supérieur de laboratoire',
    'Technicien supérieur en imagerie médicale'
  ];

  // Fonction pour afficher une notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);

  // Récupérer les contrats
  const fetchContrats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer les contrats depuis l'API
      const contratsData = await contratService.getAll();
      setContrats(contratsData);
      
      // Calculer les statistiques
      calculateStats(contratsData);
    } catch (err) {
      console.error('Erreur lors de la récupération des contrats:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Récupérer les employés
  const fetchEmployees = useCallback(async () => {
    try {
      const employeesData = await employeeService.getAll();
      setEmployees(employeesData);
    } catch (err) {
      console.error('Erreur lors de la récupération des employés:', err);
      setError('Erreur lors du chargement des employés. Veuillez réessayer plus tard.');
    }
  }, []);

  // Charger les données au chargement du composant
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchContrats(), fetchEmployees()]);
    };
    
    loadData();
  }, [fetchContrats, fetchEmployees]);

  // Calculer les statistiques
  const calculateStats = useCallback((contratsData) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;
    const byType = {};
    
    contratsData.forEach(contrat => {
      // Compter par type
      byType[contrat.type_contrat] = (byType[contrat.type_contrat] || 0) + 1;
      
      // Vérifier si le contrat est actif, expiré ou expirant bientôt
      if (contrat.type_contrat === 'CDI' || !contrat.date_fin) {
        active++;
      } else {
        const endDate = new Date(contrat.date_fin);
        
        if (endDate < today) {
          expired++;
        } else if (endDate <= thirtyDaysFromNow) {
          expiringSoon++;
          active++;
        } else {
          active++;
        }
      }
    });
    
    setStats({
      total: contratsData.length,
      active,
      expired,
      expiringSoon,
      byType
    });
  }, []);

  // Filtrer et trier les contrats
  const filteredAndSortedContrats = useMemo(() => {
    let result = [...contrats];
    
    // Appliquer la recherche
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(contrat => 
        contrat.nom_employe.toLowerCase().includes(lowerCaseSearch) ||
        contrat.poste?.toLowerCase().includes(lowerCaseSearch) ||
        contrat.service?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Appliquer le filtre par type
    if (filterType) {
      result = result.filter(contrat => contrat.type_contrat === filterType);
    }
    
    // Appliquer le filtre par service
    if (filterService) {
      result = result.filter(contrat => contrat.service === filterService);
    }
    
    // Appliquer le tri
    result.sort((a, b) => {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return result;
  }, [contrats, searchTerm, filterType, filterService, sortConfig]);

  // Pagination
  const currentContrats = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedContrats.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredAndSortedContrats, currentPage, itemsPerPage]);

  // Pagination - changement de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination - pages totales
  const totalPages = Math.ceil(filteredAndSortedContrats.length / itemsPerPage);

  // Changement de tri
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterService('');
    setCurrentPage(1);
  };

  // Soumettre un nouveau contrat
  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setError(null);

    try {
      // Préparer les données pour l'API
      const formData = new FormData();
      
      // Ajouter les champs du formulaire
      Object.keys(values).forEach(key => {
        if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
          // Ne pas ajouter la date de fin pour les CDI
          if (key === 'date_fin' && values.type_contrat === 'CDI') {
            return;
          }
          formData.append(key, values[key]);
        }
      });
      
      // Ajouter le fichier du contrat s'il existe
      if (contractFile) {
        formData.append('contrat_file', contractFile);
      }
      
      // Envoyer les données à l'API
      const response = await contratService.create(formData);
      
      // Ajouter le nouveau contrat à la liste
      setContrats(prev => [response, ...prev]);
      
      // Mettre à jour les statistiques
      calculateStats([response, ...contrats]);
      
      // Succès
      setSubmitSuccess(true);
      resetForm();
      setContractFile(null);
      showNotification('Contrat enregistré avec succès!');
      
      // Fermer la modale après succès
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du contrat:', error);
      setError('Erreur lors de l\'enregistrement du contrat. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mettre à jour un contrat existant
  const handleUpdate = async (values) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Préparer les données pour l'API
      const formData = new FormData();
      
      // Ajouter les champs du formulaire
      Object.keys(values).forEach(key => {
        if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
          // Ne pas ajouter la date de fin pour les CDI
          if (key === 'date_fin' && values.type_contrat === 'CDI') {
            return;
          }
          formData.append(key, values[key]);
        }
      });
      
      // Ajouter le fichier du contrat s'il existe
      if (contractFile) {
        formData.append('contrat_file', contractFile);
      }
      
      // Conserver le fichier actuel
      if (values.keep_file) {
        formData.append('keep_file', 'true');
      }
      
      // Envoyer les données à l'API
      const response = await contratService.update(values.id, formData);
      
      // Mettre à jour le contrat dans la liste
      setContrats(prev => prev.map(contrat => 
        contrat.id === response.id ? response : contrat
      ));
      
      // Mettre à jour les statistiques
      calculateStats(contrats.map(contrat => 
        contrat.id === response.id ? response : contrat
      ));
      
      // Succès
      showNotification('Contrat mis à jour avec succès!');
      
      // Fermer la modale
      setShowEditModal(false);
      setContractFile(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contrat:', error);
      setError('Erreur lors de la mise à jour du contrat. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visualiser les détails d'un contrat
  const handleViewDetails = async (id) => {
    try {
      setIsLoading(true);
      const contrat = await contratService.getById(id);
      setSelectedContrat(contrat);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails du contrat:', error);
      setError('Erreur lors du chargement des détails du contrat.');
    } finally {
      setIsLoading(false);
    }
  };

  // Éditer un contrat
  const handleEdit = async (id) => {
    try {
      setIsLoading(true);
      const contrat = await contratService.getById(id);
      setSelectedContrat(contrat);
      setShowEditModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement du contrat à éditer:', error);
      setError('Erreur lors du chargement du contrat à éditer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Prévisualiser un contrat
  const handlePreview = async (id) => {
    try {
      setIsLoading(true);
      const contrat = await contratService.getById(id);
      setSelectedContrat(contrat);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement de la prévisualisation du contrat:', error);
      setError('Erreur lors du chargement de la prévisualisation du contrat.');
    } finally {
      setIsLoading(false);
    }
  };

  // Télécharger un contrat
  const handleDownload = async (id) => {
    try {
      setIsLoading(true);
      await contratService.download(id);
      showNotification('Téléchargement du contrat en cours...');
    } catch (error) {
      console.error('Erreur lors du téléchargement du contrat:', error);
      setError('Erreur lors du téléchargement du contrat.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmer la suppression d'un contrat
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // Supprimer un contrat
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await contratService.delete(deleteId);
      
      // Supprimer le contrat de la liste
      const updatedContrats = contrats.filter(contrat => contrat.id !== deleteId);
      setContrats(updatedContrats);
      
      // Mettre à jour les statistiques
      calculateStats(updatedContrats);
      
      // Fermer la modale
      setShowDeleteModal(false);
      
      // Si on était en train de visualiser le contrat supprimé, fermer la modale de détails
      if (showDetailsModal && selectedContrat?.id === deleteId) {
        setShowDetailsModal(false);
      }
      
      showNotification('Contrat supprimé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression du contrat:', error);
      setError('Erreur lors de la suppression du contrat.');
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  // Gérer le changement de fichier
  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      // Vérifier la taille et le type du fichier
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (file.size > maxSize) {
        setError('Le fichier est trop volumineux. Taille maximale: 5MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        setError('Format de fichier non supporté. Formats acceptés: PDF, DOC, DOCX');
        return;
      }
      
      setContractFile(file);
      if (setFieldValue) {
        setFieldValue('contrat_file', file);
      }
    }
  };

  // Gérer le changement d'employé
  const handleEmployeeChange = (employeeId, setFieldValue) => {
    // Trouver l'employé sélectionné
    const selectedEmployee = employees.find(emp => emp.id === employeeId);
    
    if (selectedEmployee) {
      // Mettre à jour le nom de l'employé
      setFieldValue('nom_employe', `${selectedEmployee.first_name} ${selectedEmployee.last_name}`);
      
      // Mettre à jour d'autres champs si disponibles
      if (selectedEmployee.poste_actuel) {
        setFieldValue('poste', selectedEmployee.poste_actuel);
      }
      
      if (selectedEmployee.functional_area) {
        setFieldValue('service', selectedEmployee.functional_area);
      }
    }
  };

  // Générer un nouveau contrat
  const handleGenerateContract = async (values) => {
    try {
      setIsLoading(true);
      
      // Appeler l'API pour générer un contrat
      const response = await contratService.generate(values);
      
      // Télécharger le contrat généré
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrat_${values.nom_employe.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      showNotification('Contrat généré avec succès!');
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
      setError('Erreur lors de la génération du contrat.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renouveler un contrat
  const handleRenewContract = async (id) => {
    try {
      setIsLoading(true);
      
      // Récupérer le contrat à renouveler
      const contrat = await contratService.getById(id);
      
      // Préremplir le formulaire avec les données du contrat existant
      setSelectedContrat({
        ...contrat,
        id: null,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: '',
        is_renewal: true,
        previous_contract_id: contrat.id
      });
      
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement du contrat à renouveler:', error);
      setError('Erreur lors du chargement du contrat à renouveler.');
    } finally {
      setIsLoading(false);
    }
  };

  // Formater le type de contrat pour l'affichage
  const formatContractType = (type) => {
    switch (type) {
      case 'CDI':
        return <span className="badge bg-success">CDI</span>;
      case 'CDD':
        return <span className="badge bg-warning text-dark">CDD</span>;
      case 'Prestataire':
        return <span className="badge bg-info">Prestataire</span>;
      case 'Stage':
        return <span className="badge bg-secondary">Stage</span>;
      case 'Stage PNPE':
        return <span className="badge bg-primary">Stage PNPE</span>;
      default:
        return <span className="badge bg-secondary">{type}</span>;
    }
  };

  // Formater les dates pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Vérifier si un contrat est expiré
  const isContractExpired = (contract) => {
    if (contract.type_contrat === 'CDI' || !contract.date_fin) {
      return false;
    }
    
    const today = new Date();
    const endDate = new Date(contract.date_fin);
    
    return endDate < today;
  };

  // Vérifier si un contrat expire bientôt
  const isContractExpiringSoon = (contract) => {
    if (contract.type_contrat === 'CDI' || !contract.date_fin) {
      return false;
    }
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const endDate = new Date(contract.date_fin);
    
    return endDate > today && endDate <= thirtyDaysFromNow;
  };

  // Obtenir la classe CSS pour la ligne du contrat
  const getContractRowClass = (contract) => {
    if (isContractExpired(contract)) {
      return 'table-danger';
    }
    if (isContractExpiringSoon(contract)) {
      return 'table-warning';
    }
    return '';
  };

  return (
    <>
      <div className="page-title-wrapper">
        <div className="title-content">
          <h1 className="page-title">Gestion des contrats</h1>
          <p className="page-subtitle">Gérez les contrats de travail des employés.</p>
        </div>
      </div>

      {notification.show && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show animated fadeIn`} role="alert">
          <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
          {notification.message}
          <button type="button" className="btn-close" onClick={() => setNotification({ show: false, message: '', type: '' })}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show animated fadeIn" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Dashboard des statistiques */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card bg-primary text-white">
            <div className="stat-card-body">
              <div className="stat-card-title">Total des contrats</div>
              <div className="stat-card-value">{stats.total}</div>
              <div className="stat-card-icon">
                <i className="fas fa-file-signature"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="stat-card bg-success text-white">
            <div className="stat-card-body">
              <div className="stat-card-title">Contrats actifs</div>
              <div className="stat-card-value">{stats.active}</div>
              <div className="stat-card-icon">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="stat-card bg-danger text-white">
            <div className="stat-card-body">
              <div className="stat-card-title">Contrats expirés</div>
              <div className="stat-card-value">{stats.expired}</div>
              <div className="stat-card-icon">
                <i className="fas fa-calendar-times"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="stat-card bg-warning text-dark">
            <div className="stat-card-body">
              <div className="stat-card-title">Expirant bientôt</div>
              <div className="stat-card-value">{stats.expiringSoon}</div>
              <div className="stat-card-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card table-card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="card-icon">
              <i className="fas fa-file-signature"></i>
            </div>
            <h3 className="card-title">Contrats de travail</h3>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setSelectedContrat(null);
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Nouveau contrat
          </button>
        </div>
        
        <div className="card-body">
          {/* Filtres */}
          <div className="filters-container mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Rechercher par nom, poste, service..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="col-md-3">
                <select 
                  className="form-select" 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tous les types de contrat</option>
                  {contractTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3">
                <select 
                  className="form-select" 
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                >
                  <option value="">Tous les services</option>
                  {services.map((service, index) => (
                    <option key={index} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary w-100" 
                  onClick={resetFilters}
                >
                  <i className="fas fa-undo me-2"></i>Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-3 text-muted">Chargement des données...</p>
            </div>
          ) : filteredAndSortedContrats.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-file-signature empty-icon"></i>
              <h4 className="empty-title">Aucun contrat trouvé</h4>
              <p className="empty-text">
                {searchTerm || filterType || filterService ? 
                  'Aucun résultat ne correspond à vos critères de recherche.' : 
                  'Commencez par ajouter de nouveaux contrats.'}
              </p>
              {searchTerm || filterType || filterService ? (
                <button className="btn btn-outline-secondary" onClick={resetFilters}>
                  <i className="fas fa-filter-circle-xmark me-2"></i>Réinitialiser les filtres
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSelectedContrat(null);
                    setShowModal(true);
                  }}
                >
                  <i className="fas fa-plus me-2"></i>Nouveau contrat
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle custom-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('nom_employe')} className="sortable-header">
                        Employé
                        {sortConfig.key === 'nom_employe' && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('type_contrat')} className="sortable-header">
                        Type de contrat
                        {sortConfig.key === 'type_contrat' && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('poste')} className="sortable-header">
                        Poste
                        {sortConfig.key === 'poste' && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('service')} className="sortable-header">
                        Service
                        {sortConfig.key === 'service' && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('date_debut')} className="sortable-header">
                        Date de début
                        {sortConfig.key === 'date_debut' && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('date_fin')} className="sortable-header">
                        Date de fin
                        {sortConfig.key === 'date_fin' && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentContrats.map((contrat) => (
                      <tr key={contrat.id} className={getContractRowClass(contrat)}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="user-avatar me-2" style={{ 
                              width: 30, 
                              height: 30, 
                              fontSize: '0.75rem',
                              backgroundColor: `hsl(${contrat.nom_employe.length * 15}, 70%, 50%)` 
                            }}>
                              {contrat.nom_employe
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                            </div>
                            {contrat.nom_employe}
                          </div>
                        </td>
                        <td>{formatContractType(contrat.type_contrat)}</td>
                        <td>{contrat.poste || '-'}</td>
                        <td>{contrat.service}</td>
                        <td>{formatDate(contrat.date_debut)}</td>
                        <td>
                          {contrat.date_fin 
                            ? formatDate(contrat.date_fin)
                            : '-'
                          }
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-info me-1" 
                              onClick={() => handleViewDetails(contrat.id)}
                              title="Voir détails"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-primary me-1" 
                              onClick={() => handleEdit(contrat.id)}
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary me-1" 
                              onClick={() => handleDownload(contrat.id)}
                              title="Télécharger"
                              disabled={!contrat.contrat_file}
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => confirmDelete(contrat.id)}
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Page navigation" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    </li>
                    
                    {[...Array(totalPages).keys()].map(number => (
                      <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(number + 1)}
                        >
                          {number + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Contract Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-file-signature me-2 text-primary"></i>
                {selectedContrat?.is_renewal ? 'Renouvellement de contrat' : 'Nouveau contrat de travail'}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowModal(false);
                  setSelectedContrat(null);
                  setContractFile(null);
                  setError(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              {submitSuccess && (
                <div className="alert alert-success" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  Contrat enregistré avec succès!
                </div>
              )}

              <Formik
                initialValues={{
                  employee_id: selectedContrat?.employee_id || '',
                  nom_employe: selectedContrat?.nom_employe || '',
                  type_contrat: selectedContrat?.type_contrat || '',
                  date_debut: selectedContrat?.date_debut || new Date().toISOString().split('T')[0],
                  date_fin: selectedContrat?.date_fin || '',
                  poste: selectedContrat?.poste || '',
                  service: selectedContrat?.service || '',
                  salaire: selectedContrat?.salaire || '',
                  periode_essai: selectedContrat?.periode_essai || '3',
                  is_renewal: selectedContrat?.is_renewal || false,
                  previous_contract_id: selectedContrat?.previous_contract_id || null,
                  contrat_file: null
                }}
                validationSchema={contratSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, values, setFieldValue, isValid, dirty }) => (
                  <Form>
                    <div className="form-section">
                      <h6 className="section-title">Informations de l'employé</h6>
                      
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="employee_id" className="form-label">Employé <span className="text-danger">*</span></label>
                          <Field
                            as="select"
                            name="employee_id"
                            id="employee_id"
                            className={`form-select ${errors.employee_id && touched.employee_id ? 'is-invalid' : ''}`}
                            onChange={(e) => {
                              setFieldValue('employee_id', e.target.value);
                              handleEmployeeChange(e.target.value, setFieldValue);
                            }}
                          >
                            <option value="">Sélectionnez un employé</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.first_name} {employee.last_name}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage name="employee_id" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="col-md-6">
                          <label htmlFor="nom_employe" className="form-label">Nom de l'employé <span className="text-danger">*</span></label>
                          <Field
                            name="nom_employe"
                            id="nom_employe"
                            type="text"
                            className={`form-control ${errors.nom_employe && touched.nom_employe ? 'is-invalid' : ''}`}
                            readOnly
                          />
                          <ErrorMessage name="nom_employe" component="div" className="invalid-feedback" />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="poste" className="form-label">Poste <span className="text-danger">*</span></label>
                          <Field
                            name="poste"
                            id="poste"
                            type="text"
                            className={`form-control ${errors.poste && touched.poste ? 'is-invalid' : ''}`}
                          />
                          <ErrorMessage name="poste" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="col-md-6">
                          <label htmlFor="service" className="form-label">Service <span className="text-danger">*</span></label>
                          <Field
                            as="select"
                            name="service"
                            id="service"
                            className={`form-select ${errors.service && touched.service ? 'is-invalid' : ''}`}
                          >
                            <option value="">Sélectionnez un service</option>
                            {services.map((service, index) => (
                              <option key={index} value={service}>{service}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="service" component="div" className="invalid-feedback" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-section mt-4">
                      <h6 className="section-title">Détails du contrat</h6>

                      <div className="mb-3">
                        <label htmlFor="type_contrat" className="form-label">Type de contrat <span className="text-danger">*</span></label>
                        <Field
                          as="select"
                          name="type_contrat"
                          id="type_contrat"
                          className={`form-select ${errors.type_contrat && touched.type_contrat ? 'is-invalid' : ''}`}
                        >
                          <option value="">Sélectionnez un type de contrat</option>
                          {contractTypes.map((type, index) => (
                            <option key={index} value={type}>{type}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="type_contrat" component="div" className="invalid-feedback" />
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="date_debut" className="form-label">Date de début <span className="text-danger">*</span></label>
                          <Field
                            name="date_debut"
                            id="date_debut"
                            type="date"
                            className={`form-control ${errors.date_debut && touched.date_debut ? 'is-invalid' : ''}`}
                          />
                          <ErrorMessage name="date_debut" component="div" className="invalid-feedback" />
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="date_fin" className="form-label">
                            Date de fin
                            {values.type_contrat && values.type_contrat !== 'CDI' && (
                              <span className="text-danger">*</span>
                            )}
                          </label>
                          <Field
                            name="date_fin"
                            id="date_fin"
                            type="date"
                            className={`form-control ${errors.date_fin && touched.date_fin ? 'is-invalid' : ''}`}
                            disabled={values.type_contrat === 'CDI'}
                          />
                          <ErrorMessage name="date_fin" component="div" className="invalid-feedback" />
                          {values.type_contrat === 'CDI' && (
                            <small className="form-text text-muted">Non applicable pour un CDI</small>
                          )}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="salaire" className="form-label">Salaire <span className="text-danger">*</span></label>
                          <div className="input-group">
                            <Field
                              name="salaire"
                              id="salaire"
                              type="number"
                              className={`form-control ${errors.salaire && touched.salaire ? 'is-invalid' : ''}`}
                              placeholder="Montant"
                            />
                            <span className="input-group-text">FCFA</span>
                          </div>
                          <ErrorMessage name="salaire" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="col-md-6">
                          <label htmlFor="periode_essai" className="form-label">Période d'essai (mois)</label>
                          <Field
                            name="periode_essai"
                            id="periode_essai"
                            type="number"
                            className={`form-control ${errors.periode_essai && touched.periode_essai ? 'is-invalid' : ''}`}
                            placeholder="Durée en mois"
                            min="0"
                          />
                          <ErrorMessage name="periode_essai" component="div" className="invalid-feedback" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="contrat_file" className="form-label">Fichier du contrat</label>
                        <input 
                          type="file" 
                          id="contrat_file"
                          className="form-control" 
                          onChange={(e) => handleFileChange(e, setFieldValue)} 
                          accept=".pdf,.doc,.docx"
                        />
                        <div className="form-text">Format accepté: PDF, DOC, DOCX (max 5MB)</div>
                        {contractFile && (
                          <div className="mt-2">
                            <span className="badge bg-success">
                              <i className="fas fa-check me-1"></i>
                              Fichier sélectionné: {contractFile.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => {
                          setShowModal(false);
                          setSelectedContrat(null);
                          setContractFile(null);
                        }}
                      >
                        <i className="fas fa-times me-2"></i>
                        Annuler
                      </button>
                      
                      <button 
                        type="button" 
                        className="btn btn-outline-primary me-2" 
                        onClick={() => handleGenerateContract(values)}
                        disabled={!isValid || !dirty || isSubmitting}
                      >
                        <i className="fas fa-file-download me-2"></i>
                        Générer le contrat
                      </button>
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={!isValid || !dirty || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Traitement...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Enregistrer
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
      )}

      {/* Edit Contract Modal */}
      {showEditModal && selectedContrat && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-edit me-2 text-primary"></i>
                Modifier le contrat
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowEditModal(false);
                  setContractFile(null);
                  setError(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <Formik
                initialValues={{
                  id: selectedContrat.id,
                  employee_id: selectedContrat.employee_id || '',
                  nom_employe: selectedContrat.nom_employe || '',
                  type_contrat: selectedContrat.type_contrat || '',
                  date_debut: selectedContrat.date_debut || '',
                  date_fin: selectedContrat.date_fin || '',
                  poste: selectedContrat.poste || '',
                  service: selectedContrat.service || '',
                  salaire: selectedContrat.salaire || '',
                  periode_essai: selectedContrat.periode_essai || '3',
                  contrat_file: null,
                  keep_file: true
                }}
                validationSchema={contratSchema}
                onSubmit={handleUpdate}
              >
                {({ errors, touched, values, setFieldValue, isValid, dirty }) => (
                  <Form>
                    <div className="form-section">
                      <h6 className="section-title">Informations de l'employé</h6>
                      
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="employee_id" className="form-label">Employé <span className="text-danger">*</span></label>
                          <Field
                            as="select"
                            name="employee_id"
                            id="employee_id"
                            className={`form-select ${errors.employee_id && touched.employee_id ? 'is-invalid' : ''}`}
                            onChange={(e) => {
                              setFieldValue('employee_id', e.target.value);
                              handleEmployeeChange(e.target.value, setFieldValue);
                            }}
                          >
                            <option value="">Sélectionnez un employé</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.first_name} {employee.last_name}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage name="employee_id" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="col-md-6">
                          <label htmlFor="nom_employe" className="form-label">Nom de l'employé <span className="text-danger">*</span></label>
                          <Field
                            name="nom_employe"
                            id="nom_employe"
                            type="text"
                            className={`form-control ${errors.nom_employe && touched.nom_employe ? 'is-invalid' : ''}`}
                            readOnly
                          />
                          <ErrorMessage name="nom_employe" component="div" className="invalid-feedback" />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="poste" className="form-label">Poste <span className="text-danger">*</span></label>
                          <Field
                            name="poste"
                            id="poste"
                            type="text"
                            className={`form-control ${errors.poste && touched.poste ? 'is-invalid' : ''}`}
                          />
                          <ErrorMessage name="poste" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="col-md-6">
                          <label htmlFor="service" className="form-label">Service <span className="text-danger">*</span></label>
                          <Field
                            as="select"
                            name="service"
                            id="service"
                            className={`form-select ${errors.service && touched.service ? 'is-invalid' : ''}`}
                          >
                            <option value="">Sélectionnez un service</option>
                            {services.map((service, index) => (
                              <option key={index} value={service}>{service}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="service" component="div" className="invalid-feedback" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-section mt-4">
                      <h6 className="section-title">Détails du contrat</h6>

                      <div className="mb-3">
                        <label htmlFor="type_contrat" className="form-label">Type de contrat <span className="text-danger">*</span></label>
                        <Field
                          as="select"
                          name="type_contrat"
                          id="type_contrat"
                          className={`form-select ${errors.type_contrat && touched.type_contrat ? 'is-invalid' : ''}`}
                        >
                          <option value="">Sélectionnez un type de contrat</option>
                          {contractTypes.map((type, index) => (
                            <option key={index} value={type}>{type}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="type_contrat" component="div" className="invalid-feedback" />
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="date_debut" className="form-label">Date de début <span className="text-danger">*</span></label>
                          <Field
                            name="date_debut"
                            id="date_debut"
                            type="date"
                            className={`form-control ${errors.date_debut && touched.date_debut ? 'is-invalid' : ''}`}
                          />
                          <ErrorMessage name="date_debut" component="div" className="invalid-feedback" />
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="date_fin" className="form-label">
                            Date de fin
                            {values.type_contrat && values.type_contrat !== 'CDI' && (
                              <span className="text-danger">*</span>
                            )}
                          </label>
                          <Field
                            name="date_fin"
                            id="date_fin"
                            type="date"
                            className={`form-control ${errors.date_fin && touched.date_fin ? 'is-invalid' : ''}`}
                            disabled={values.type_contrat === 'CDI'}
                          />
                          <ErrorMessage name="date_fin" component="div" className="invalid-feedback" />
                          {values.type_contrat === 'CDI' && (
                            <small className="form-text text-muted">Non applicable pour un CDI</small>
                          )}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="salaire" className="form-label">Salaire <span className="text-danger">*</span></label>
                          <div className="input-group">
                            <Field
                              name="salaire"
                              id="salaire"
                              type="number"
                              className={`form-control ${errors.salaire && touched.salaire ? 'is-invalid' : ''}`}
                              placeholder="Montant"
                            />
                            <span className="input-group-text">FCFA</span>
                          </div>
                          <ErrorMessage name="salaire" component="div" className="invalid-feedback" />
                        </div>
                        
                        <div className="col-md-6">
                          <label htmlFor="periode_essai" className="form-label">Période d'essai (mois)</label>
                          <Field
                            name="periode_essai"
                            id="periode_essai"
                            type="number"
                            className={`form-control ${errors.periode_essai && touched.periode_essai ? 'is-invalid' : ''}`}
                            placeholder="Durée en mois"
                            min="0"
                          />
                          <ErrorMessage name="periode_essai" component="div" className="invalid-feedback" />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="contrat_file" className="form-label">Fichier du contrat</label>
                        <input 
                          type="file" 
                          id="contrat_file"
                          className="form-control" 
                          onChange={(e) => handleFileChange(e, setFieldValue)} 
                          accept=".pdf,.doc,.docx"
                        />
                        
                        {selectedContrat.contrat_file && (
                          <div className="mt-2 d-flex align-items-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary me-3"
                              onClick={() => handleDownload(selectedContrat.id)}
                            >
                              <i className="fas fa-file-download me-1"></i>
                              Contrat actuel
                            </button>
                            <div className="form-check">
                              <Field
                                type="checkbox"
                                name="keep_file"
                                id="keep_file"
                                className="form-check-input"
                              />
                              <label className="form-check-label" htmlFor="keep_file">
                                Conserver le fichier actuel
                              </label>
                            </div>
                          </div>
                        )}
                        
                        <div className="form-text">Format accepté: PDF, DOC, DOCX (max 5MB)</div>
                        {contractFile && (
                          <div className="mt-2">
                            <span className="badge bg-success">
                              <i className="fas fa-check me-1"></i>
                              Nouveau fichier sélectionné: {contractFile.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => {
                          setShowEditModal(false);
                          setContractFile(null);
                        }}
                      >
                        <i className="fas fa-times me-2"></i>
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
                            Traitement...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Mettre à jour
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
      )}

      {/* Contract Details Modal */}
      {showDetailsModal && selectedContrat && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-info-circle me-2 text-primary"></i>
                Détails du contrat
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowDetailsModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="contract-details">
                <div className="contract-header">
                  <div className="contract-type">
                    {formatContractType(selectedContrat.type_contrat)}
                  </div>
                </div>
                
                <div className="row mt-4">
                  <div className="col-md-6">
                    <div className="info-section">
                      <h6 className="section-title">Informations de l'employé</h6>
                      <div className="info-group">
                        <div className="info-label">Nom :</div>
                        <div className="info-value fw-bold">{selectedContrat.nom_employe}</div>
                      </div>
                      <div className="info-group">
                        <div className="info-label">Poste :</div>
                        <div className="info-value">{selectedContrat.poste}</div>
                      </div>
                      <div className="info-group">
                        <div className="info-label">Service :</div>
                        <div className="info-value">{selectedContrat.service}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="info-section">
                      <h6 className="section-title">Détails du contrat</h6>
                      <div className="info-group">
                        <div className="info-label">Date de début :</div>
                        <div className="info-value">{formatDate(selectedContrat.date_debut)}</div>
                      </div>
                      <div className="info-group">
                        <div className="info-label">Date de fin :</div>
                        <div className="info-value">
                          {selectedContrat.date_fin ? formatDate(selectedContrat.date_fin) : 'Indéterminée (CDI)'}
                          {isContractExpired(selectedContrat) && (
                            <span className="badge bg-danger ms-2">Expiré</span>
                          )}
                          {isContractExpiringSoon(selectedContrat) && (
                            <span className="badge bg-warning text-dark ms-2">Expire bientôt</span>
                          )}
                        </div>
                      </div>
                      <div className="info-group">
                        <div className="info-label">Salaire :</div>
                        <div className="info-value">
                          {selectedContrat.salaire ? `${parseInt(selectedContrat.salaire).toLocaleString()} FCFA` : '-'}
                        </div>
                      </div>
                      <div className="info-group">
                        <div className="info-label">Période d'essai :</div>
                        <div className="info-value">
                          {selectedContrat.periode_essai ? `${selectedContrat.periode_essai} mois` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row mt-4">
                  <div className="col-md-12">
                    <div className="info-section">
                      <h6 className="section-title">Document du contrat</h6>
                      {selectedContrat.contrat_file ? (
                        <div className="document-item">
                          <div className="document-icon">
                            <i className="far fa-file-pdf"></i>
                          </div>
                          <div className="document-info">
                            <div className="document-name">
                              Contrat_{selectedContrat.nom_employe.replace(/\s+/g, '_')}.pdf
                            </div>
                            <div className="document-actions">
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleDownload(selectedContrat.id)}
                              >
                                <i className="fas fa-download me-1"></i>
                                Télécharger
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted fst-italic">Aucun document de contrat disponible</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  <i className="fas fa-times me-2"></i>
                  Fermer
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedContrat.id);
                  }}
                >
                  <i className="fas fa-edit me-2"></i>
                  Modifier
                </button>
                
                {selectedContrat.type_contrat !== 'CDI' && selectedContrat.date_fin && !isContractExpired(selectedContrat) && (
                  <button 
                    type="button" 
                    className="btn btn-info"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleRenewContract(selectedContrat.id);
                    }}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    Renouveler
                  </button>
                )}
                
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => {
                    setShowDetailsModal(false);
                    confirmDelete(selectedContrat.id);
                  }}
                >
                  <i className="fas fa-trash me-2"></i>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                Confirmer la suppression
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer ce contrat ?</p>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-circle me-2"></i>
                Cette action est irréversible. Toutes les données associées à ce contrat seront définitivement supprimées.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
              >
                <i className="fas fa-times me-2"></i>
                Annuler
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDelete}
              >
                <i className="fas fa-trash me-2"></i>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS supplémentaires */}
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalFadeIn 0.3s ease-out;
        }
        
        .modal-lg {
          max-width: 800px;
        }
        
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .stat-card {
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          height: 100%;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card-body {
          padding: 20px;
          position: relative;
          z-index: 1;
        }
        
        .stat-card-title {
          font-size: 14px;
          margin-bottom: 10px;
          opacity: 0.8;
        }
        
        .stat-card-value {
          font-size: 28px;
          font-weight: bold;
        }
        
        .stat-card-icon {
          position: absolute;
          right: 20px;
          top: 15px;
          font-size: 30px;
          opacity: 0.3;
        }
        
        .card-icon {
          background-color: #f0f7ff;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          color: #0d6efd;
        }
        
        .card-title {
          margin-bottom: 0;
          font-size: 18px;
        }
        
        .form-section {
          margin-bottom: 15px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #0d6efd;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 5px;
        }
        
        .contract-details {
          padding: 10px;
        }
        
        .contract-header {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .contract-type {
          font-size: 1.2rem;
        }
        
        .info-section {
          margin-bottom: 20px;
        }
        
        .info-group {
          margin-bottom: 10px;
        }
        
        .info-label {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-size: 1rem;
        }
        
        .document-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background-color: #f8f9fa;
        }
        
        .document-icon {
          font-size: 24px;
          color: #dc3545;
          margin-right: 15px;
        }
        
        .document-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .document-name {
          font-weight: 500;
        }
        
        .sortable-header {
          cursor: pointer;
          user-select: none;
          position: relative;
        }
        
        .sortable-header:hover {
          background-color: #f8f9fa;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }
        
        .empty-icon {
          font-size: 60px;
          color: #dee2e6;
          margin-bottom: 20px;
        }
        
        .empty-title {
          font-size: 18px;
          margin-bottom: 10px;
        }
        
        .empty-text {
          color: #6c757d;
          margin-bottom: 20px;
        }
        
        .filters-container {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-weight: bold;
        }
        
        .animated {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
        
        .fadeIn {
          animation-name: fadeIn;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @media print {
          .actions-bar, .filters-container, .action-btns, .modal-backdrop {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ContractManagement;
