import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Default timeout
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear session storage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication services
// Mise à jour du service d'authentification pour les employés

// Authentication services
export const authService = {
  // Méthode de connexion existante (pour les administrateurs RH)
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Stocker le token et les informations utilisateur
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  // Nouvelle méthode pour la connexion des employés
  employeeLogin: async (email, password) => {
    try {
      const response = await api.post('/employees/auth/login', { email, password });
      
      // Stocker les informations de l'employé si l'authentification réussit
      if (response.data.success) {
        // Stocker l'employé sous une clé différente pour éviter les conflits
        sessionStorage.setItem('employeeUser', JSON.stringify(response.data.employee));
        
        // Optionnellement, stocker un token si votre API en fournit un
        if (response.data.token) {
          sessionStorage.setItem('employeeToken', response.data.token);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error during employee login:', error);
      throw error;
    }
  },
  
  // Déconnexion de l'employé
  employeeLogout: () => {
    sessionStorage.removeItem('employeeUser');
    sessionStorage.removeItem('employeeToken');
    // Rediriger vers la page de connexion employé
    window.location.href = '/EmployeeLogin';
  },

  // Changer le mot de passe de l'employé
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/employees/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing employee password:', error);
      throw error;
    }
  },
  
  // Vérifier si un employé est connecté
  isEmployeeLoggedIn: () => {
    return sessionStorage.getItem('employeeUser') !== null;
  },
  
  // Récupérer les informations de l'employé connecté
  getLoggedInEmployee: () => {
    const employeeData = sessionStorage.getItem('employeeUser');
    if (employeeData) {
      try {
        return JSON.parse(employeeData);
      } catch (error) {
        console.error('Error parsing employee data:', error);
        return null;
      }
    }
    return null;
  },
  
  // Vos autres méthodes existantes
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
};

// Employee services
export const employeeService = {
   // Ajoutez cette nouvelle fonction
   authenticate: async (matricule, password) => {
    try {
      const response = await api.post('/employees/auth/login', { matricule, password });
      return response.data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },
  // Get all employees
  getAll: async () => {
    try {
      const response = await api.get('/employees');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
  
  // Search employees with filters
  search: async (params) => {
    try {
      const response = await api.get('/employees/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  },
  
  // Get employee by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new employee
  create: async (employeeData) => {
    try {
      const response = await api.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },
  
  // Update an employee
  update: async (id, employeeData) => {
    try {
      const response = await api.put(`/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating employee ${id}:`, error);
      throw error;
    }
  },
  
  // Delete an employee
  delete: async (id) => {
    try {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting employee ${id}:`, error);
      throw error;
    }
  },
  
  // Get employees with expiring contracts - with error handling
  getExpiringContracts: async (daysThreshold = 30) => {
    try {
      const response = await api.get('/employees/alerts/expiring-contracts', {
        params: { daysThreshold },
        timeout: 15000, // Extended timeout for this endpoint
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      // Return empty contracts array to prevent UI crashes
      return { contracts: [] };
    }
  },
  
  // Get employee statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/employees/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee statistics:', error);
      throw error;
    }
  }
};

// Employee request services - version améliorée
export const requestService = {
  // Récupérer toutes les demandes
  getAll: async () => {
    try {
      const response = await api.get('/requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee requests:', error);
      throw error;
    }
  },
  
  // Récupérer les demandes d'un employé spécifique
  getByEmployeeId: async (employeeId) => {
    try {
      const response = await api.get(`/requests/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee requests for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // Récupérer une demande par son ID
  getById: async (id) => {
    try {
      const response = await api.get(`/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee request ${id}:`, error);
      throw error;
    }
  },
  
  // Créer une nouvelle demande
  create: async (requestData) => {
    try {
      const response = await api.post('/requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating employee request:', error);
      throw error;
    }
  },
  
  // Approuver une demande
  approve: async (id, comments) => {
    try {
      const response = await api.put(`/requests/${id}/approve`, { 
        response_comments: comments 
      });
      return response.data;
    } catch (error) {
      console.error(`Error approving employee request ${id}:`, error);
      throw error;
    }
  },
  
  // Rejeter une demande
  reject: async (id, rejectedBy, rejectionReason) => {
    try {
      const response = await api.put(`/requests/${id}/reject`, { 
        response_comments: rejectionReason 
      });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting employee request ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer une demande
  delete: async (id) => {
    try {
      const response = await api.delete(`/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting employee request ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des demandes avec filtres
  search: async (filters) => {
    try {
      const response = await api.get('/requests/search/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching employee requests:', error);
      // Retourner un tableau vide en cas d'erreur pour éviter les crashs dans l'UI
      return [];
    }
  },
  
  // Obtenir les statistiques des demandes
  getStatistics: async () => {
    try {
      const response = await api.get('/requests/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee request statistics:', error);
      // Retourner des statistiques par défaut en cas d'erreur
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        leaves: 0,
        absences: 0,
        documents: 0
      };
    }
  }
};

// Service pour les sanctions disciplinaires
export const sanctionService = {
  // Récupérer toutes les sanctions
  getAll: async () => {
    try {
      const response = await api.get('/sanctions');
      return response.data;
    } catch (error) {
      console.error('Error fetching sanctions:', error);
      throw error;
    }
  },
  
  // Récupérer une sanction par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/sanctions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sanction ${id}:`, error);
      throw error;
    }
  },
  
  // Récupérer les sanctions d'un employé par son nom
  getByEmployeeName: async (nom) => {
    try {
      const response = await api.get(`/sanctions/employe/${encodeURIComponent(nom)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sanctions by employee name:', error);
      throw error;
    }
  },
  
  // Créer une nouvelle sanction
  create: async (sanctionData) => {
    try {
      const response = await api.post('/sanctions', sanctionData);
      return response.data;
    } catch (error) {
      console.error('Error creating sanction:', error);
      throw error;
    }
  },
  
  // Mettre à jour une sanction
  update: async (id, sanctionData) => {
    try {
      const response = await api.put(`/sanctions/${id}`, sanctionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating sanction ${id}:`, error);
      throw error;
    }
  },
  
  // Annuler une sanction
  cancel: async (id, motif_annulation) => {
    try {
      const response = await api.put(`/sanctions/${id}/cancel`, { motif_annulation });
      return response.data;
    } catch (error) {
      console.error(`Error canceling sanction ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer une sanction
  delete: async (id) => {
    try {
      const response = await api.delete(`/sanctions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting sanction ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des sanctions
  search: async (filters) => {
    try {
      const response = await api.get('/sanctions/search/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching sanctions:', error);
      throw error;
    }
  }
};

// Service pour les visites médicales
export const visiteMedicaleService = {
  // Récupérer toutes les visites médicales
  getAll: async () => {
    try {
      console.log('FRONTEND: Appel à API getAll');
      const startTime = performance.now();
      
      const response = await api.get('/visites-medicales');
      
      const endTime = performance.now();
      console.log(`FRONTEND: getAll a pris ${endTime - startTime}ms`);
      console.log('FRONTEND: Données reçues:', response.data.length, 'visites');
      
      if (response.data.length > 0) {
        console.log('FRONTEND: Premier enregistrement:', response.data[0]);
        
        // Vérifier les statuts distincts
        const statuts = [...new Set(response.data.map(r => r.statut))];
        console.log('FRONTEND: Statuts présents dans les données:', statuts);
        
        // Vérifier les formats de dates
        const firstVisit = response.data[0];
        console.log('FRONTEND: Format de date_derniere_visite:', firstVisit.date_derniere_visite);
        console.log('FRONTEND: Format de date_prochaine_visite:', firstVisit.date_prochaine_visite);
      }
      
      return response.data;
    } catch (error) {
      console.error('FRONTEND: Erreur dans getAll:', error);
      throw error;
    }
  },
  
  // Récupérer une visite médicale par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/visites-medicales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching medical visit ${id}:`, error);
      throw error;
    }
  },
  
  // Créer une nouvelle visite médicale
  create: async (visiteData) => {
    try {
      const response = await api.post('/visites-medicales', visiteData);
      return response.data;
    } catch (error) {
      console.error('Error creating medical visit:', error);
      throw error;
    }
  },
  
  // Mettre à jour une visite médicale
  update: async (id, visiteData) => {
    try {
      const response = await api.put(`/visites-medicales/${id}`, visiteData);
      return response.data;
    } catch (error) {
      console.error(`Error updating medical visit ${id}:`, error);
      throw error;
    }
  },
  
  // Mettre à jour le statut d'une visite médicale
  updateStatus: async (id, statusData) => {
    try {
      const response = await api.put(`/visites-medicales/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error(`Error updating medical visit status ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer une visite médicale
  delete: async (id) => {
    try {
      const response = await api.delete(`/visites-medicales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting medical visit ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des visites médicales avec filtres
  search: async (filters) => {
    try {
      const response = await api.get('/visites-medicales/search', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching medical visits:', error);
      throw error;
    }
  },
  
  // Obtenir des statistiques sur les visites médicales
 // Récupérer les statistiques
 getStatistics: async () => {
  try {
    console.log('FRONTEND: Appel à API getStatistics');
    const startTime = performance.now();
    
    const response = await api.get('/visites-medicales/stats/overview');
    
    const endTime = performance.now();
    console.log(`FRONTEND: getStatistics a pris ${endTime - startTime}ms`);
    console.log('FRONTEND: Statistiques reçues:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('FRONTEND: Erreur dans getStatistics:', error);
    // Return default stats to prevent UI crashes
    return {
      overdueCount: 0,
      days30Count: 0,
      days90Count: 0,
      completedCount: 0
    };
  }
}
};

// Service pour l'historique de recrutement
export const recrutementService = {
  // Récupérer tous les recrutements
  getAll: async () => {
    try {
      const response = await api.get('/recrutements');
      return response.data;
    } catch (error) {
      console.error('Error fetching recruitment history:', error);
      throw error;
    }
  },
  
  // Récupérer un recrutement par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/recrutements/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching recruitment ${id}:`, error);
      throw error;
    }
  },
  
  // Créer un nouveau recrutement
  create: async (formData) => {
    try {
      // Utiliser FormData pour permettre l'upload de CV
      const response = await api.post('/recrutements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating recruitment record:', error);
      throw error;
    }
  },
  
  // Mettre à jour un recrutement
  update: async (id, formData) => {
    try {
      // Utiliser FormData pour permettre l'upload de CV
      const response = await api.put(`/recrutements/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating recruitment ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer un recrutement
  delete: async (id) => {
    try {
      const response = await api.delete(`/recrutements/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting recruitment ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des recrutements
  search: async (filters) => {
    try {
      const response = await api.get('/recrutements/search/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching recruitment records:', error);
      throw error;
    }
  },
  
  // Télécharger un CV
  downloadCV: async (id) => {
    try {
      // Utiliser window.open pour télécharger le fichier
      window.open(`${api.defaults.baseURL}/recrutements/cv/${id}`, '_blank');
      return true;
    } catch (error) {
      console.error('Error downloading CV:', error);
      throw error;
    }
  }
};

// Service pour l'historique des départs
export const departService = {
  // Récupérer tous les départs
  getAll: async () => {
    try {
      const response = await api.get('/departs');
      return response.data;
    } catch (error) {
      console.error('Error fetching departures:', error);
      throw error;
    }
  },
  
  // Récupérer un départ par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/departs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching departure ${id}:`, error);
      throw error;
    }
  },
  
  // Créer un nouveau départ
  create: async (departData) => {
    try {
      const response = await api.post('/departs', departData);
      return response.data;
    } catch (error) {
      console.error('Error creating departure:', error);
      throw error;
    }
  },
  
  // Mettre à jour un départ
  update: async (id, departData) => {
    try {
      const response = await api.put(`/departs/${id}`, departData);
      return response.data;
    } catch (error) {
      console.error(`Error updating departure ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer un départ
  delete: async (id) => {
    try {
      const response = await api.delete(`/departs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting departure ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des départs
  search: async (filters) => {
    try {
      const response = await api.get('/departs/search/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching departures:', error);
      throw error;
    }
  },
  
  // Obtenir les statistiques des départs
  getStatistics: async () => {
    try {
      const response = await api.get('/departs/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching departure statistics:', error);
      throw error;
    }
  }
};

// Leave request services
export const leaveService = {
  getAll: async () => {
    const response = await api.get('/leaves');
    return response.data;
  },
  getByEmployeeId: async (employeeId) => {
    const response = await api.get(`/leaves/employee/${employeeId}`);
    return response.data;
  },
  create: async (leaveData) => {
    const response = await api.post('/leaves', leaveData);
    return response.data;
  },
  approve: async (id, approvedBy) => {
    const response = await api.put(`/leaves/${id}/approve`, { approvedBy });
    return response.data;
  },
  reject: async (id, rejectedBy, rejectionReason) => {
    const response = await api.put(`/leaves/${id}/reject`, { rejectedBy, rejectionReason });
    return response.data;
  },
  markInProgress: async (id) => {
    const response = await api.put(`/leaves/${id}/in-progress`);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/leaves/${id}`);
    return response.data;
  },
};

// Contract services - keeping your original name 'contratService'
export const contratService = {
  getAll: async () => {
    const response = await api.get('/contrats');
    return response.data;
  },
  getByEmployeeId: async (employeeId) => {
    const response = await api.get(`/contrats/employee/${employeeId}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/contrats/${id}`);
    return response.data;
  },
  create: async (contractData) => {
    const response = await api.post('/contrats', contractData);
    return response.data;
  },
  update: async (id, contractData) => {
    const response = await api.put(`/contrats/${id}`, contractData);
    return response.data;
  },
  terminate: async (id, terminationReason) => {
    const response = await api.put(`/contrats/${id}/terminate`, { terminationReason });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/contrats/${id}`);
    return response.data;
  },
};

// Keep your other services as they were in the original file
// Export the effectifService to match your existing exports
export const effectifService = {
  // Add your effectif service methods here
  // For example:
  getAll: async () => {
    const response = await api.get('/effectifs');
    return response.data;
  },
};

// Service notes services (mise à jour)
export const noteService = {
  // Récupérer toutes les notes (pour l'administration RH)
  getAll: async () => {
    try {
      const response = await api.get('/notes');
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },
  
  // Récupérer uniquement les notes publiques (pour le portail employé)
  getPublicNotes: async () => {
    try {
      const response = await api.get('/notes/public');
      return response.data;
    } catch (error) {
      console.error('Error fetching public notes:', error);
      throw error;
    }
  },
  
  // Récupérer une note par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching note ${id}:`, error);
      throw error;
    }
  },
  
  // Créer une nouvelle note
  create: async (noteData) => {
    try {
      const response = await api.post('/notes', noteData);
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },
  
  // Mettre à jour une note
  update: async (id, noteData) => {
    try {
      const response = await api.put(`/notes/${id}`, noteData);
      return response.data;
    } catch (error) {
      console.error(`Error updating note ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer une note
  delete: async (id) => {
    try {
      const response = await api.delete(`/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      throw error;
    }
  },
  
  // Publier/Dépublier une note
  togglePublic: async (id) => {
    try {
      const response = await api.put(`/notes/${id}/toggle-public`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling note ${id} public status:`, error);
      throw error;
    }
  },
  
  // Rechercher des notes
  search: async (filters) => {
    try {
      const response = await api.get('/notes/search/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }
};

// Performance evaluation services
export const performanceService = {
  getAll: async () => {
    const response = await api.get('/performance');
    return response.data;
  },
  getByEmployeeId: async (employeeId) => {
    const response = await api.get(`/performance/employee/${employeeId}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/performance/${id}`);
    return response.data;
  },
  create: async (evaluationData) => {
    const response = await api.post('/performance', evaluationData);
    return response.data;
  },
  update: async (id, evaluationData) => {
    const response = await api.put(`/performance/${id}`, evaluationData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/performance/${id}`);
    return response.data;
  },
};

// Service pour les événements
export const evenementService = {
  // Récupérer tous les événements
  getAll: async () => {
    try {
      const response = await api.get('/evenements');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },
  
  // Récupérer les événements à venir
  getUpcoming: async () => {
    try {
      const response = await api.get('/evenements/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },
  
  // Récupérer un événement par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/evenements/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  },
  
  // Créer un nouvel événement
  create: async (eventData) => {
    try {
      const response = await api.post('/evenements', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
  
  // Mettre à jour un événement
  update: async (id, eventData) => {
    try {
      const response = await api.put(`/evenements/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer un événement
  delete: async (id) => {
    try {
      const response = await api.delete(`/evenements/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des événements
  search: async (filters) => {
    try {
      const response = await api.get('/evenements/search/filter', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }
};

// Service pour les absences
export const absenceService = {
  // Récupérer toutes les absences
  getAll: async () => {
    const response = await api.get('/absences');
    return response.data;
  },
  
  // Récupérer une absence par ID
  getById: async (id) => {
    const response = await api.get(`/absences/${id}`);
    return response.data;
  },
  
  // Récupérer les absences d'un employé
  getByEmployeeName: async (nom) => {
    const response = await api.get(`/absences/employe/${nom}`);
    return response.data;
  },
  
  // Créer une nouvelle absence
  create: async (formData) => {
    // Utiliser FormData pour permettre l'upload de fichiers
    const response = await api.post('/absences', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Mettre à jour une absence
  update: async (id, formData) => {
    // Utiliser FormData pour permettre l'upload de fichiers
    const response = await api.put(`/absences/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Traiter une absence (approuver/refuser)
  processAbsence: async (id, statut) => {
    const response = await api.put(`/absences/${id}/traiter`, { statut });
    return response.data;
  },
  
  // Supprimer une absence
  delete: async (id) => {
    const response = await api.delete(`/absences/${id}`);
    return response.data;
  },
  
  // Rechercher des absences
  search: async (filters) => {
    const response = await api.get('/absences/search/filter', { params: filters });
    return response.data;
  }
};

// Export direct du service de changement de mot de passe
export const changePassword = authService.changePassword;

export default api;