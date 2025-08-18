import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importations des composants
import Login from './components/auth/Login';
import EmployeeLogin from './components/employees/EmployeeLogin';
import MedicalLogin from './components/medical/MedicalLogin';
import Dashboard from './components/dashboard/Dashboard';
import NewEmployee from './components/employees/NewEmployee';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeDetail from './components/employees/EmployeeDetail';
import LeaveManagement from './components/leaves/LeaveManagement';
import Sanctions from './components/hr/Sanctions';
import AbsenceManagement from './components/leaves/AbsenceManagement';
import ContractManagement from './components/contracts/ContractManagement';
import RecruitmentHistory from './components/recruitment/RecruitmentHistory';
import DepartureHistory from './components/employees/DepartureHistory';
import PerformanceManagement from './components/performance/PerformanceManagement';
import ServiceNotes from './components/notes/ServiceNotes';
import EmployeeRequests from './components/requests/EmployeeRequests';
import MedicalVisits from './components/medical/MedicalVisits';
import ProcedureTracking from './components/recruitment/ProcedureTracking';
import Layout from './components/layout/Layout';
import ContractAlerts from './components/employees/ContractAlerts';
import EmployeePortal from './components/employees/EmployeePortal'; 
import MedicalFileTracking from './components/medical/MedicalFileTracking';
import EventManagement from './components/event/EventManagement';
import EditEmployee from './components/employees/EditEmployee';
import Onboarding from './components/onboarding/Onboarding';
import Offboarding from './components/onboarding/Offboarding';
import Interviews from './components/hr/Interviews';
import HRTasks from './components/hr/HRTasks';
import ChartsPage from './components/dashboard/ChartsPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isEmployeeAuthenticated, setIsEmployeeAuthenticated] = useState(false);
  const [isMedicalAuthenticated, setIsMedicalAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check admin authentication
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    // Check employee authentication
    const storedEmployeeUser = sessionStorage.getItem('employeeUser');
    if (storedEmployeeUser) {
      setIsEmployeeAuthenticated(true);
    }

    // Check medical authentication
    const storedMedicalUser = sessionStorage.getItem('medecin_user');
    if (storedMedicalUser) {
      setIsMedicalAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const handleAdminLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('user');
  };

  const handleEmployeeLogin = (userData) => {
    setIsEmployeeAuthenticated(true);
    sessionStorage.setItem('employeeUser', JSON.stringify(userData));
  };

  const handleEmployeeLogout = () => {
    setIsEmployeeAuthenticated(false);
    sessionStorage.removeItem('employeeUser');
  };

  const handleMedicalLogin = (userData) => {
    setIsMedicalAuthenticated(true);
    sessionStorage.setItem('medecin_user', JSON.stringify(userData));
  };

  return (
    <Router>
      <Routes>
        {/* Home Route - Redirects based on user type */}
        <Route 
          path="/home" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            isEmployeeAuthenticated ? 
            <Navigate to="/EmployeePortal" replace /> :
            isMedicalAuthenticated ? 
            <Navigate to="/medical-file-tracking" replace /> :
            <Navigate to="/login" replace />
          } 
        />

        {/* Admin Login Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Login onLogin={handleAdminLogin} />
          } 
        />

        {/* Employee Login Route */}
        <Route 
          path="/employee-login" 
          element={
            isEmployeeAuthenticated ? 
            <Navigate to="/EmployeePortal" replace /> : 
            <EmployeeLogin onLogin={handleEmployeeLogin} />
          } 
        />

        {/* Medical Login Route */}
        <Route 
          path="/medical-login" 
          element={
            isMedicalAuthenticated ? 
            <Navigate to="/medical-file-tracking" replace /> : 
            <MedicalLogin onLogin={handleMedicalLogin} />
          } 
        />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Layout user={user} onLogout={handleAdminLogout} /> : 
            isEmployeeAuthenticated ? 
            <Navigate to="/EmployeePortal" replace /> :
            isMedicalAuthenticated ? 
            <Navigate to="/medical-file-tracking" replace /> :
            <Navigate to="/login" replace />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="new-employee" element={<NewEmployee />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="leave-management" element={<LeaveManagement />} />
          <Route path="absences" element={<AbsenceManagement />} />
          <Route path="sanctions" element={<Sanctions />} />
          <Route path="contrats" element={<ContractManagement />} />
          <Route path="performance-management" element={<PerformanceManagement />} />
          <Route path="service-notes" element={<ServiceNotes />} />
          <Route path="employee-requests" element={<EmployeeRequests />} />
          <Route path="recruitment-history" element={<RecruitmentHistory />} />
          <Route path="departure-history" element={<DepartureHistory />} />
          <Route path="medical-visits" element={<MedicalVisits />} />
          <Route path="procedure-tracking" element={<ProcedureTracking />} />
          <Route path="contract-alerts" element={<ContractAlerts />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="edit-employee/:id" element={<EditEmployee />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="offboarding" element={<Offboarding />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="hr-tasks" element={<HRTasks />} />
          <Route path="charts" element={<ChartsPage />} />
          
        </Route>

        {/* Protected Employee Routes */}
        <Route 
          path="/EmployeePortal" 
          element={
            isEmployeeAuthenticated ? 
            <EmployeePortal onLogout={handleEmployeeLogout} /> : 
            <Navigate to="/employee-login" replace />
          } 
        />

        {/* Protected Medical Routes */}
        <Route 
          path="/medical-file-tracking" 
          element={
            isMedicalAuthenticated ? 
            <MedicalFileTracking /> : 
            <Navigate to="/medical-login" replace />
          } 
        />
        
        {/* Default Redirect */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            isEmployeeAuthenticated ? 
            <Navigate to="/EmployeePortal" replace /> :
            isMedicalAuthenticated ? 
            <Navigate to="/medical-file-tracking" replace /> :
            <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;