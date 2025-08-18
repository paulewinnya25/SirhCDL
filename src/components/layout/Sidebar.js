import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const [activeMenus, setActiveMenus] = useState({});
  
  // Define menu structure
  const menuItems = [
    {
      title: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      path: '/dashboard',
      subMenu: null
    },
    {
      title: 'Mes entreprises',
      icon: 'fas fa-building',
      path: '#',
      subMenu: [
        { title: 'Centre Diagnostic', path: '#' },
        { title: 'Optikah', path: '#' },
        { title: 'Centre wellness', path: '#' },
        { title: 'Café walhya', path: '#' }
      ]
    },
    {
      title: 'On/Off boarding',
      icon: 'fas fa-sign-in-alt',
      path: '#',
      subMenu: [
        { title: 'Onboarding', path: '/onboarding' },
        { title: 'Offboarding', path: '/offboarding' }
      ]
    },
    {
      title: 'Gestion des Employés',
      icon: 'fas fa-users',
      path: '#',
      subMenu: [
        { title: 'Ajouter un Employé', path: '/new-employee' },
        { title: 'Effectif', path: '/employees' }
       
      ]
    },
    {
      title: 'Gestion des Congés',
      icon: 'fas fa-calendar-alt',
      path: '#',
      subMenu: [
        { title: 'Congés', path: '/leave-management' },
        { title: 'Absences', path: '/absences' }
      ]
    },
    
    {
      title: 'Gestion RH',
      icon: 'fas fa-briefcase',
      path: '#',
      subMenu: [
        { title: 'Entretiens', path: '/interviews' },
        { title: 'Démarches RH', path: '/hr-tasks' }
      ]
    },
    
    {
      title: 'Recrutement',
      icon: 'fas fa-user-tie',
      path: '#',
      subMenu: [
        { title: 'Historique de recrutement', path: '/recruitment-history' },
        { title: 'Suivi procédure', path: '/procedure-tracking' },
        { title: 'Historique de depart', path: '/departure-history' },
        { title: 'Visites Médicale', path: '/medical-visits' }
      ]
    },
  
    {
      title: 'Documents',
      icon: 'fas fa-file-alt',
      path: '#',
      subMenu: [
        { title: 'Code du travail', path: '/labor-code' },
        { title: 'Règlement intérieur', path: '/internal-regulations' }
      ]
    },
    {
      title: 'Évènements',
      icon: 'fas fa-calendar-check',
      path: '#',
      subMenu: [
        { title: 'Ajouter évènement', path: '/events' }
      ]
    },
    {
      title: 'Graphiques',
      icon: 'fas fa-chart-bar',
      path: '#',
      subMenu: [
        { title: 'Graphiques', path: '/charts' }
      ]
    }
  ];

  // Handle menu toggling
  const toggleMenu = (index) => {
    setActiveMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Check if a menu item should be active based on current path
  const isActiveMenuItem = (item) => {
    if (item.path === location.pathname) return true;
    if (item.subMenu) {
      return item.subMenu.some(subItem => subItem.path === location.pathname);
    }
    return false;
  };

  // Initialize active menu based on current path
  useEffect(() => {
    const newActiveMenus = {};
    
    menuItems.forEach((item, index) => {
      if (item.subMenu && item.subMenu.some(subItem => subItem.path === location.pathname)) {
        newActiveMenus[index] = true;
      }
    });
    
    setActiveMenus(newActiveMenus);
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <img 
          src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png" 
          alt="Centre Diagnostic Logo" 
        />
      </div>
      
      <ul className="nav-menu">
        {menuItems.map((item, index) => (
          <li 
            key={index} 
            className={`nav-item ${activeMenus[index] ? 'active' : ''} ${isActiveMenuItem(item) ? 'current' : ''}`}
          >
            {item.subMenu ? (
              // Menu with submenu
              <>
                <a 
                  href="#" 
                  className={`nav-link ${isActiveMenuItem(item) ? 'active' : ''}`} 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleMenu(index);
                  }}
                >
                  <div className="nav-icon"><i className={item.icon}></i></div>
                  <span className="nav-text">{item.title}</span>
                  {item.subMenu && <i className="fas fa-chevron-right nav-arrow"></i>}
                </a>
                
                {item.subMenu && (
                  <ul className="sub-menu">
                    {item.subMenu.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <Link 
                          to={subItem.path} 
                          className={`sub-menu-link ${location.pathname === subItem.path ? 'active' : ''}`}
                        >
                          {subItem.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              // Menu without submenu
              <Link 
                to={item.path} 
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <div className="nav-icon"><i className={item.icon}></i></div>
                <span className="nav-text">{item.title}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;