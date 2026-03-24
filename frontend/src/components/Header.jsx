import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/patients': 'Gestión de Pacientes',
  '/appointments': 'Agenda y Citas',
  '/clinical': 'Historial Clínico',
  '/finance': 'Finanzas',
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const label = routeLabels[pathname] || 'MediConsult';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{label}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
