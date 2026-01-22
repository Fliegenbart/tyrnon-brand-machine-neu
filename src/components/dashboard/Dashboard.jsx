import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';

export default function Dashboard() {
  const { brands, createBrand } = useBrandStore();
  const navigate = useNavigate();

  const handleCreateBrand = async () => {
    const brand = await createBrand('Neue Marke');
    navigate(`/brand/${brand.id}/tokens`);
  };

  return (
    <div className="dashboard">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Brand Portfolio</h1>
          <p className="page-subtitle">Alle deine Marken an einem Ort</p>
        </div>
        <button className="btn-primary" onClick={handleCreateBrand}>
          + Neue Marke
        </button>
      </header>

      <div className="dashboard-grid">
        {brands.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h2>Keine Marken vorhanden</h2>
            <p>Erstelle deine erste Marke um loszulegen</p>
            <button className="btn-primary" onClick={handleCreateBrand}>
              Erste Marke erstellen
            </button>
          </div>
        ) : (
          brands.map(brand => (
            <Link
              key={brand.id}
              to={`/brand/${brand.id}`}
              className="brand-card"
            >
              <div
                className="brand-card-header"
                style={{
                  background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})`
                }}
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="brand-card-logo" />
                ) : (
                  <div className="brand-card-initial">
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="brand-card-body">
                <h3>{brand.name}</h3>
                <p className="brand-card-tagline">
                  {brand.voice?.tagline || 'Keine Tagline definiert'}
                </p>
                <div className="brand-card-colors">
                  {Object.values(brand.colors).slice(0, 5).map((color, i) => (
                    <span
                      key={i}
                      className="color-dot"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="brand-card-footer">
                <span className="brand-card-meta">
                  {brand.voice?.tone || 'Professionell'}
                </span>
              </div>
            </Link>
          ))
        )}

        <button className="brand-card brand-card-add" onClick={handleCreateBrand}>
          <div className="add-icon">+</div>
          <span>Neue Marke</span>
        </button>
      </div>
    </div>
  );
}
