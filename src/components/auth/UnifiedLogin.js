import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import unifiedAuthService from '../../services/unifiedAuthService';
import '../../styles/UnifiedLogin.css';

const UnifiedLogin = () => {
  const { setUserDirectly } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState(null); // 'rh', 'employee', or null
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();

  // Détecter automatiquement le type d'utilisateur basé sur l'identifiant
  useEffect(() => {
    if (identifier.trim()) {
      const detectedType = unifiedAuthService.detectUserType(identifier);
      setUserType(detectedType);
    } else {
      setUserType(null);
    }
  }, [identifier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation de base
    if (!identifier.trim()) {
      setError('Veuillez saisir votre identifiant (email ou matricule)');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Veuillez saisir votre mot de passe');
      setIsLoading(false);
      return;
    }

    try {
      // Utiliser le service d'authentification unifié
      const result = await unifiedAuthService.login(identifier.trim(), password);

      if (result.success) {
        if (result.userType === 'rh') {
          // Connexion RH - utiliser directement les données du service unifié
          if (result.user) {
            // S'assurer que l'utilisateur a un ID
            if (!result.user.id) {
              result.user.id = result.user.email || identifier.trim();
            }
            
            // Utiliser setUserDirectly pour mettre à jour le contexte directement
            setUserDirectly(result.user);
            
            // Stocker le token si disponible
            if (result.token) {
              sessionStorage.setItem('token', result.token);
            }
            
            // Se souvenir de l'utilisateur si demandé
            if (rememberMe) {
              unifiedAuthService.rememberUser(identifier.trim(), 'rh');
            }
            
            // Naviguer vers le dashboard
            navigate('/dashboard');
          } else {
            setError('Erreur lors de la connexion');
          }
        } else if (result.userType === 'employee') {
          // Connexion Employé
          if (result.employee) {
            console.log('✅ Authentification employé réussie:', result.employee);
            
            // Stocker les données dans sessionStorage
            sessionStorage.setItem('employeeUser', JSON.stringify(result.employee));
            console.log('💾 Données employé stockées dans sessionStorage');
            
            // Se souvenir de l'utilisateur si demandé
            if (rememberMe) {
              unifiedAuthService.rememberUser(identifier.trim().toUpperCase(), 'employee');
            }
            
            // Utiliser window.location pour forcer la navigation et le rechargement
            // Cela garantit que App.js détecte correctement l'authentification
            console.log('🔄 Redirection vers /EmployeePortal...');
            window.location.href = '/EmployeePortal';
          } else {
            setError('Erreur lors de la connexion');
          }
        }
      } else {
        setError(result.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'identifiant mémorisé au chargement
  useEffect(() => {
    const remembered = unifiedAuthService.getRememberedUser();
    
    if (remembered.identifier) {
      setIdentifier(remembered.identifier);
      setUserType(remembered.userType);
    }
  }, []);

  // Déterminer le placeholder et l'icône selon le type d'utilisateur
  const getInputConfig = () => {
    if (userType === 'rh') {
      return {
        placeholder: 'Votre adresse email',
        icon: 'fa-envelope',
        label: 'Adresse email'
      };
    } else if (userType === 'employee') {
      return {
        placeholder: 'Votre matricule (ex: CDL-2024-0001)',
        icon: 'fa-id-card',
        label: 'Matricule'
      };
    } else {
      return {
        placeholder: 'Email (RH) ou Matricule (Employé)',
        icon: 'fa-user',
        label: 'Identifiant'
      };
    }
  };

  const inputConfig = getInputConfig();

  return (
    <div className="unified-login-page">
      <div className="unified-login-container">
        <div className="unified-login-card">
          <div className="unified-login-header">
            <img 
              src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png" 
              alt="Centre Diagnostic Logo" 
              className="unified-login-logo" 
            />
            <h1 className="unified-login-title">Bienvenue !</h1>
            <p className="unified-login-subtitle">
              {userType === 'rh' 
                ? 'Connexion Administrateur RH' 
                : userType === 'employee' 
                ? 'Connexion Employé' 
                : 'Connectez-vous à votre espace'}
            </p>
          </div>
          
          {error && (
            <div className="unified-alert unified-alert-danger">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="unified-login-form">
            <div className="unified-form-group">
              <label htmlFor="identifier" className="unified-form-label">
                {inputConfig.label}
              </label>
              <div className="unified-input-group">
                <i className={`fas ${inputConfig.icon} unified-input-icon`}></i>
                <input 
                  type="text" 
                  id="identifier"
                  className="unified-form-control" 
                  placeholder={inputConfig.placeholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                {userType && (
                  <span className="unified-user-type-badge">
                    {userType === 'rh' ? '👔 RH' : '👤 Employé'}
                  </span>
                )}
              </div>
              {identifier && !userType && (
                <small className="unified-form-hint">
                  💡 Format attendu : email (ex: user@example.com) ou matricule (ex: CDL-2024-0001)
                </small>
              )}
            </div>
            
            <div className="unified-form-group">
              <label htmlFor="password" className="unified-form-label">Mot de passe</label>
              <div className="unified-input-group">
                <i className="fas fa-lock unified-input-icon"></i>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  className="unified-form-control" 
                  placeholder="Votre mot de passe" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <i 
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} unified-password-toggle`}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                ></i>
              </div>
            </div>
            
            <div className="unified-form-options">
              <div className="unified-form-check">
                <input 
                  className="unified-form-check-input" 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="unified-form-check-label" htmlFor="rememberMe">
                  Se souvenir de moi
                </label>
              </div>
              <a href="#forgot-password" className="unified-forgot-password">
                Mot de passe oublié ?
              </a>
            </div>
            
            <button 
              type="submit" 
              className="unified-btn unified-btn-primary unified-btn-block" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="unified-spinner-border" role="status" aria-hidden="true"></span>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Se connecter
                </>
              )}
            </button>
          </form>
          
          <div className="unified-login-footer">
            <div className="unified-login-help">
              <p><strong>Besoin d'aide ?</strong></p>
              <p className="unified-help-text">
                <span className="unified-help-item">
                  <i className="fas fa-envelope"></i> RH : Utilisez votre adresse email
                </span>
                <span className="unified-help-item">
                  <i className="fas fa-id-card"></i> Employé : Utilisez votre matricule (CDL-YYYY-XXXX)
                </span>
              </p>
            </div>
            <p className="unified-copyright">© 2025 Centre Diagnostic. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;

