import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { useRulesStore } from '../../stores/rulesStore';

export default function BrandOverview() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { getBrandById, deleteBrand } = useBrandStore();
  const { clearRules } = useRulesStore();
  const brand = getBrandById(brandId);

  const handleDeleteBrand = async () => {
    if (confirm(`"${brand.name}" wirklich löschen? Alle Daten und Regeln werden unwiderruflich gelöscht.`)) {
      await clearRules(brandId);
      await deleteBrand(brandId);
      navigate('/');
    }
  };

  if (!brand) {
    return (
      <div className="not-found">
        <h2>Marke nicht gefunden</h2>
        <button onClick={() => navigate('/')}>Zurück zum Dashboard</button>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Tokens bearbeiten',
      description: 'Farben, Typografie und Brand Voice',
      icon: 'T',
      path: `/brand/${brandId}/tokens`,
      color: brand.colors.primary
    },
    {
      title: 'Assets erstellen',
      description: 'Website, Social, Flyer, E-Mail',
      icon: 'A',
      path: `/brand/${brandId}/assets`,
      color: brand.colors.secondary
    },
    {
      title: 'Campaign starten',
      description: 'Multi-Channel Kampagne planen',
      icon: 'C',
      path: `/brand/${brandId}/campaigns`,
      color: brand.colors.accent
    },
    {
      title: 'Exportieren',
      description: 'Figma, PPTX, CSS, PDF',
      icon: 'E',
      path: `/brand/${brandId}/exports`,
      color: '#6366f1'
    }
  ];

  return (
    <div className="brand-overview">
      <header className="brand-hero" style={{
        background: `linear-gradient(135deg, ${brand.colors.primary}20, ${brand.colors.secondary}20)`
      }}>
        <div className="brand-hero-content">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="brand-hero-logo" />
          ) : (
            <div
              className="brand-hero-initial"
              style={{ backgroundColor: brand.colors.primary }}
            >
              {brand.name.charAt(0)}
            </div>
          )}
          <div className="brand-hero-info">
            <h1>{brand.name}</h1>
            {brand.voice?.tagline && (
              <p className="brand-tagline">{brand.voice.tagline}</p>
            )}
          </div>
          <button
            className="btn-delete-brand"
            onClick={handleDeleteBrand}
            title="Marke löschen"
          >
            Marke löschen
          </button>
        </div>

        <div className="brand-token-preview">
          <div className="token-colors">
            {Object.entries(brand.colors).map(([name, color]) => (
              <div key={name} className="token-color-item">
                <span
                  className="token-color-swatch"
                  style={{ backgroundColor: color }}
                />
                <span className="token-color-name">{name}</span>
              </div>
            ))}
          </div>
          <div className="token-fonts">
            <span style={{ fontFamily: brand.fonts.heading }}>
              {brand.fonts.heading.split(',')[0].replace(/'/g, '')}
            </span>
            <span style={{ fontFamily: brand.fonts.body }}>
              {brand.fonts.body.split(',')[0].replace(/'/g, '')}
            </span>
          </div>
        </div>
      </header>

      <section className="quick-actions">
        <h2>Schnellzugriff</h2>
        <div className="quick-actions-grid">
          {quickActions.map(action => (
            <Link
              key={action.path}
              to={action.path}
              className="quick-action-card"
            >
              <div
                className="quick-action-icon"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <div className="quick-action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <span className="quick-action-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="brand-stats">
        <h2>Brand Health</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{Object.keys(brand.colors).length}</div>
            <div className="stat-label">Farben definiert</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">2</div>
            <div className="stat-label">Schriften</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{brand.voice?.tone ? '✓' : '–'}</div>
            <div className="stat-label">Voice definiert</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{brand.logo ? '✓' : '–'}</div>
            <div className="stat-label">Logo hochgeladen</div>
          </div>
        </div>
      </section>
    </div>
  );
}
