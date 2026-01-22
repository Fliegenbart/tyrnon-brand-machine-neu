import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';

export default function Sidebar({ brands, activeBrandId, currentPath, onLogout }) {
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editName, setEditName] = useState('');
  const { createBrand, updateBrand, deleteBrand, setActiveBrand } = useBrandStore();
  const navigate = useNavigate();

  const activeBrand = brands.find(b => b.id === activeBrandId);
  const isOnBrandPage = currentPath.includes('/brand/');

  const handleCreateBrand = async () => {
    const brand = await createBrand('Neue Marke');
    navigate(`/brand/${brand.id}`);
    setShowBrandMenu(false);
  };

  const handleSelectBrand = (brandId) => {
    setActiveBrand(brandId);
    navigate(`/brand/${brandId}`);
    setShowBrandMenu(false);
  };

  const startEditing = (brand, e) => {
    e.stopPropagation();
    setEditingBrandId(brand.id);
    setEditName(brand.name);
  };

  const saveEdit = async () => {
    if (editName.trim() && editingBrandId) {
      await updateBrand(editingBrandId, { name: editName.trim() });
    }
    setEditingBrandId(null);
  };

  const handleDeleteBrand = async (brandId, e) => {
    e.stopPropagation();
    if (confirm('Marke wirklich löschen?')) {
      await deleteBrand(brandId);
      if (brandId === activeBrandId) {
        navigate('/');
      }
    }
  };

  const navItems = activeBrandId ? [
    { path: `/brand/${activeBrandId}`, label: 'Overview', icon: 'O' },
    { path: `/brand/${activeBrandId}/tokens`, label: 'Tokens', icon: 'T' },
    { path: `/brand/${activeBrandId}/assets`, label: 'Assets', icon: 'A' },
    { path: `/brand/${activeBrandId}/intelligence`, label: 'Upload', icon: '↑' },
    { path: `/brand/${activeBrandId}/campaigns`, label: 'Campaigns', icon: 'C' },
    { path: `/brand/${activeBrandId}/exports`, label: 'Exports', icon: 'E' },
  ] : [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="logo">
          <span className="logo-mark">T</span>
          <span className="logo-text">TYRN.ON</span>
        </Link>
      </div>

      <div className="brand-selector">
        <button
          className="brand-selector-btn"
          onClick={() => setShowBrandMenu(!showBrandMenu)}
        >
          {activeBrand ? (
            <>
              <span
                className="brand-dot"
                style={{ backgroundColor: activeBrand.colors.primary }}
              />
              <span className="brand-name">{activeBrand.name}</span>
            </>
          ) : (
            <span className="brand-name">Marke wählen...</span>
          )}
          <span className="chevron">{showBrandMenu ? '▲' : '▼'}</span>
        </button>

        {showBrandMenu && (
          <div className="brand-menu">
            {brands.map(brand => (
              <div
                key={brand.id}
                className={`brand-menu-item ${brand.id === activeBrandId ? 'active' : ''}`}
                onClick={() => handleSelectBrand(brand.id)}
              >
                {editingBrandId === brand.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="brand-edit-input"
                  />
                ) : (
                  <>
                    <span
                      className="brand-dot"
                      style={{ backgroundColor: brand.colors.primary }}
                    />
                    <span className="brand-label">{brand.name}</span>
                    <div className="brand-actions">
                      <button onClick={(e) => startEditing(brand, e)} title="Umbenennen">✎</button>
                      <button onClick={(e) => handleDeleteBrand(brand.id, e)} title="Löschen">×</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <button className="brand-menu-add" onClick={handleCreateBrand}>
              + Neue Marke
            </button>
          </div>
        )}
      </div>

      {isOnBrandPage && activeBrandId && (
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Brand</span>
            {navItems.slice(0, 4).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-section">
            <span className="nav-section-title">Marketing</span>
            {navItems.slice(4).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className="sidebar-footer">
        <Link to="/settings" className={`nav-item ${currentPath === '/settings' ? 'active' : ''}`}>
          <span className="nav-icon">⚙</span>
          <span className="nav-label">Einstellungen</span>
        </Link>
        <button className="logout-btn" onClick={onLogout}>
          <span className="nav-icon">↪</span>
          <span className="nav-label">Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
