import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../../styles/Tables.css';
import '../../styles/Forms.css';

const ContractManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);

  // Validation schema for contract form
  const contractSchema = Yup.object().shape({
    employeeId: Yup.string().required('L\'employé est requis'),
    contractType: Yup.string().required('Le type de contrat est requis'),
    startDate: Yup.date().required('La date de début est requise'),
    endDate: Yup.date().when('contractType', {
      is: (type) => type !== 'CDI',
      then: Yup.date().required('La date de fin est requise')
        .min(
          Yup.ref('startDate'), 
          'La date de fin doit être postérieure à la date de début'
        ),
      otherwise: Yup.date().nullable()
    }),
    position: Yup.string().required('Le poste est requis'),
    department: Yup.string().required('Le département est requis'),
    salary: Yup.number()
      .required('Le salaire est requis')
      .positive('Le salaire doit être positif'),
  });

  // Contract types
  const contractTypes = [
    'CDI',
    'CDD',
    'Intérim',
    'Stage',
    'Alternance',
    'Freelance'
  ];

  // Mock employees list
  const employees = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Robert Johnson' }
  ];

  // Departments
  const departments = [
    'Administration',
    'Ressources Humaines',
    'Finance',
    'Marketing',
    'Informatique',
    'Production',
    'Logistique',
    'Commercial',
    'Recherche et Développement'
  ];

  useEffect(() => {
    // Simulate API call to fetch contracts
    const fetchContracts = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        // Mock data
        const mockContracts = [
          {
            id: '1',
            employeeId: '1',
            employeeName: 'John Doe',
            contractType: 'CDI',
            startDate: '2024-01-15',
            endDate: null,
            position: 'Développeur Senior',
            department: 'Informatique',
            salary: 48000,
            status: 'Active',
            createdBy: 'Admin RH',
            createdAt: '2024-01-10'
          },
          {
            id: '2',
            employeeId: '2',
            employeeName: 'Jane Smith',
            contractType: 'CDD',
            startDate: '2024-06-01',
            endDate: '2025-06-01',
            position: 'Responsable Marketing',
            department: 'Marketing',
            salary: 42000,
            status: 'Active',
            createdBy: 'Admin RH',
            createdAt: '2024-05-15'
          },
          {
            id: '3',
            employeeId: '3',
            employeeName: 'Robert Johnson',
            contractType: 'Stage',
            startDate: '2024-07-01',
            endDate: '2024-12-31',
            position: 'Assistant RH',
            department: 'Ressources Humaines',
            salary: 12000,
            status: 'Pending',
            createdBy: 'Admin RH',
            createdAt: '2024-06-20'
          }
        ];
        
        setContracts(mockContracts);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Handle contract submission
  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      // In a real application, this would be an API call
      console.log('Form values:', values);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a new contract object
      const newContract = {
        id: Date.now().toString(),
        employeeId: values.employeeId,
        employeeName: employees.find(emp => emp.id === values.employeeId)?.name || 'Unknown',
        contractType: values.contractType,
        startDate: values.startDate,
        endDate: values.endDate || null,
        position: values.position,
        department: values.department,
        salary: values.salary,
        status: 'Pending',
        createdBy: 'Admin RH',
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      // Add the new contract to the list
      setContracts(prev => [newContract, ...prev]);
      
      // Success
      setSubmitSuccess(true);
      resetForm();
      
      // Close modal after success
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error submitting contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view contract details
  const handleViewDetails = (id) => {
    const contract = contracts.find(c => c.id === id);
    setSelectedContract(contract);
    // In a real app, this would open a modal with details
    console.log('Viewing contract details:', contract);
  };

  return (
    <>
      <div className="page-title-wrapper">
        <div className="title-content">
          <h1 className="page-title">Gestion des contrats</h1>
          <p className="page-subtitle">Gérez les contrats de travail des employés.</p>
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
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Nouveau contrat
          </button>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="alert alert-info text-center">
              <i className="fas fa-info-circle me-2"></i>
              Aucun contrat trouvé.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle custom-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Type de contrat</th>
                    <th>Poste</th>
                    <th>Département</th>
                    <th>Date de début</th>
                    <th>Date de fin</th>
                    <th>Salaire annuel</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>{contract.employeeName}</td>
                      <td>{contract.contractType}</td>
                      <td>{contract.position}</td>
                      <td>{contract.department}</td>
                      <td>{new Date(contract.startDate).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {contract.endDate 
                          ? new Date(contract.endDate).toLocaleDateString('fr-FR')
                          : '-'
                        }
                      </td>
                      <td>{contract.salary.toLocaleString('fr-FR')} €</td>
                      <td>
                        {contract.status === 'Active' && (
                          <span className="badge bg-success">Actif</span>
                        )}
                        {contract.status === 'Pending' && (
                          <span className="badge bg-warning text-dark">En attente</span>
                        )}
                        {contract.status === 'Expired' && (
                          <span className="badge bg-secondary">Expiré</span>
                        )}
                        {contract.status === 'Terminated' && (
                          <span className="badge bg-danger">Résilié</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-info me-1" 
                            onClick={() => handleViewDetails(contract.id)}
                            title="Voir détails"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            title="Télécharger"
                          >
                            <i className="fas fa-download"></i>
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

      {/* New Contract Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nouveau contrat de travail</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowModal(false)}
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
                  employeeId: '',
                  contractType: '',
                  startDate: '',
                  endDate: '',
                  position: '',
                  department: '',
                  salary: ''
                }}
                validationSchema={contractSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, values }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="employeeId" className="form-label">Employé <span className="text-danger">*</span></label>
                      <Field
                        as="select"
                        name="employeeId"
                        className={`form-select ${errors.employeeId && touched.employeeId ? 'is-invalid' : ''}`}
                      >
                        <option value="">Sélectionnez un employé</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="employeeId" component="div" className="invalid-feedback" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="contractType" className="form-label">Type de contrat <span className="text-danger">*</span></label>
                      <Field
                        as="select"
                        name="contractType"
                        className={`form-select ${errors.contractType && touched.contractType ? 'is-invalid' : ''}`}
                      >
                        <option value="">Sélectionnez un type de contrat</option>
                        {contractTypes.map((type, index) => (
                          <option key={index} value={type}>{type}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="contractType" component="div" className="invalid-feedback" />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="startDate" className="form-label">Date de début <span className="text-danger">*</span></label>
                        <Field
                          name="startDate"
                          type="date"
                          className={`form-control ${errors.startDate && touched.startDate ? 'is-invalid' : ''}`}
                        />
                        <ErrorMessage name="startDate" component="div" className="invalid-feedback" />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="endDate" className="form-label">
                          Date de fin
                          {values.contractType && values.contractType !== 'CDI' && (
                            <span className="text-danger">*</span>
                          )}
                        </label>
                        <Field
                          name="endDate"
                          type="date"
                          className={`form-control ${errors.endDate && touched.endDate ? 'is-invalid' : ''}`}
                          disabled={values.contractType === 'CDI'}
                        />
                        <ErrorMessage name="endDate" component="div" className="invalid-feedback" />
                        {values.contractType === 'CDI' && (
                          <small className="form-text text-muted">Non applicable pour un CDI</small>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="position" className="form-label">Poste <span className="text-danger">*</span></label>
                      <Field
                        name="position"
                        type="text"
                        className={`form-control ${errors.position && touched.position ? 'is-invalid' : ''}`}
                      />
                      <ErrorMessage name="position" component="div" className="invalid-feedback" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="department" className="form-label">Département <span className="text-danger">*</span></label>
                      <Field
                        as="select"
                        name="department"
                        className={`form-select ${errors.department && touched.department ? 'is-invalid' : ''}`}
                      >
                        <option value="">Sélectionnez un département</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>{dept}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="department" component="div" className="invalid-feedback" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="salary" className="form-label">Salaire annuel (€) <span className="text-danger">*</span></label>
                      <Field
                        name="salary"
                        type="number"
                        className={`form-control ${errors.salary && touched.salary ? 'is-invalid' : ''}`}
                      />
                      <ErrorMessage name="salary" component="div" className="invalid-feedback" />
                    </div>

                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
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
    </>
  );
};

export default ContractManagement;