import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import LoginScreen from '../LoginScreen';
import { useBrandStore } from '../../stores/brandStore';

export default function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { brands, isLoading, activeBrandId, setActiveBrand } = useBrandStore();
  const navigate = useNavigate();
  const { brandId } = useParams();
  const location = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem('brand_engine_auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (brandId && brandId !== activeBrandId) {
      setActiveBrand(brandId);
    }
  }, [brandId, activeBrandId, setActiveBrand]);

  const handleLogin = (password) => {
    if (password === 'brandengine2024') {
      localStorage.setItem('brand_engine_auth', 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('brand_engine_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Lade Brand Engine...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        brands={brands}
        activeBrandId={activeBrandId || brandId}
        currentPath={location.pathname}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
