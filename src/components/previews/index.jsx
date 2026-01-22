import React, { useState } from 'react';
import { generateVCardQR } from '../../lib/qrcode.js';

// Editable text component
function EditableText({ value, onChange, placeholder, style, className, multiline = false, tag: Tag = 'span' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');

  const handleClick = (e) => {
    e.stopPropagation();
    setTempValue(value || '');
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onChange(tempValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setTempValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return multiline ? (
      <textarea
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`editable-input editable-textarea ${className || ''}`}
        style={style}
      />
    ) : (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`editable-input ${className || ''}`}
        style={style}
      />
    );
  }

  return (
    <Tag
      className={`editable-text ${className || ''} ${!value ? 'placeholder' : ''}`}
      style={style}
      onClick={handleClick}
      title="Klicken zum Bearbeiten"
    >
      {value || placeholder}
    </Tag>
  );
}

// Image placeholder with Unsplash hint
function ImagePlaceholder({ brand, onSelectImage, style, className }) {
  return (
    <div className={`image-placeholder ${className || ''}`} style={style}>
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <span className="placeholder-text">Bild-Platzhalter</span>
        <span className="placeholder-hint">Unsplash-Integration kommt bald</span>
      </div>
    </div>
  );
}

// Helper to get headline styles from learned rules
function getHeadlineStyle(brand) {
  const baseStyle = { fontFamily: brand.fonts.heading };
  const learned = brand.learnedStyles || {};

  if (learned.headlineTransform) {
    baseStyle.textTransform = learned.headlineTransform;
  }
  if (learned.headlineLetterSpacing) {
    baseStyle.letterSpacing = learned.headlineLetterSpacing;
  }
  if (learned.headingSize) {
    baseStyle.fontSize = `${learned.headingSize}pt`;
  }

  return baseStyle;
}

// Helper to get body styles from learned rules
function getBodyStyle(brand) {
  const baseStyle = { fontFamily: brand.fonts.body };
  const learned = brand.learnedStyles || {};

  if (learned.bodySize) {
    baseStyle.fontSize = `${learned.bodySize}pt`;
  }

  return baseStyle;
}

// Helper to get spacing from learned rules
function getSpacing(brand, size = 'md') {
  const learned = brand.learnedStyles || {};
  const tokens = learned.spacing?.tokens;

  if (tokens && tokens[size]) {
    return `${tokens[size]}px`;
  }

  // Fallbacks
  const defaults = { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' };
  return defaults[size] || '16px';
}

// Helper to get logo position from learned rules
function getLogoPosition(brand) {
  return brand.learnedStyles?.logoPosition || 'top-left';
}

export function WebsitePreview({ brand, content, onFieldChange }) {
  const fields = content?.fields || {};
  const headlineStyle = getHeadlineStyle(brand);
  const bodyStyle = getBodyStyle(brand);
  const logoPosition = getLogoPosition(brand);

  const handleChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Determine nav layout based on logo position
  const navStyle = {
    borderBottomColor: brand.colors.primary + '30',
    flexDirection: logoPosition.includes('right') ? 'row-reverse' : 'row'
  };

  return (
    <div className="preview-frame website-preview" style={{ backgroundColor: brand.colors.background, color: brand.colors.text }}>
      <nav style={navStyle}>
        <div className="nav-logo" style={{ color: brand.colors.primary }}>
          {brand.logo ? <img src={brand.logo} alt="" style={{ height: '24px' }} /> : brand.name}
        </div>
        <div className="nav-links">
          {(fields.navLinks?.value || ['Produkte', 'Uber uns', 'Kontakt']).map((link, i) => <span key={i}>{link}</span>)}
        </div>
      </nav>
      <div className="hero-section">
        <EditableText
          tag="h1"
          value={fields.headline?.value}
          onChange={(v) => handleChange('headline', v)}
          placeholder={brand.voice?.tagline || 'Ihre Headline hier'}
          style={headlineStyle}
        />
        <EditableText
          tag="p"
          value={fields.subline?.value}
          onChange={(v) => handleChange('subline', v)}
          placeholder="Beschreibung hier"
          style={bodyStyle}
          multiline
        />
        <EditableText
          tag="button"
          value={fields.cta?.value}
          onChange={(v) => handleChange('cta', v)}
          placeholder="Mehr erfahren"
          style={{ backgroundColor: brand.colors.primary }}
        />
      </div>
      {!fields.image?.value && (
        <ImagePlaceholder brand={brand} className="hero-image-placeholder" />
      )}
    </div>
  );
}

export function SocialPreview({ brand, content, onFieldChange }) {
  const fields = content?.fields || {};
  const headlineStyle = { ...getHeadlineStyle(brand), color: '#fff' };
  const logoPosition = getLogoPosition(brand);

  const handleChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Logo positioning class
  const logoClass = `social-logo social-logo-${logoPosition}`;

  return (
    <div className="preview-frame social-preview" style={{ backgroundColor: brand.colors.primary }}>
      <div className="social-content">
        {brand.logo && <img src={brand.logo} alt="" className={logoClass} />}
        {fields.image?.value ? (
          <img src={fields.image.value} alt="" className="social-main-image" />
        ) : (
          <ImagePlaceholder brand={brand} className="social-image-placeholder" />
        )}
        <EditableText
          tag="h2"
          value={fields.headline?.value}
          onChange={(v) => handleChange('headline', v)}
          placeholder={brand.voice?.tagline || 'Social Post'}
          style={headlineStyle}
        />
        <div className="social-accent" style={{ backgroundColor: brand.colors.accent }} />
        {fields.hashtags?.value && (
          <EditableText
            tag="p"
            value={fields.hashtags.value}
            onChange={(v) => handleChange('hashtags', v)}
            placeholder="#hashtags"
            className="social-hashtags"
          />
        )}
      </div>
    </div>
  );
}

export function PresentationPreview({ brand, content, onFieldChange }) {
  const fields = content?.fields || {};
  const headlineStyle = { ...getHeadlineStyle(brand), color: brand.colors.text };
  const bodyStyle = getBodyStyle(brand);
  const logoPosition = getLogoPosition(brand);
  const margin = getSpacing(brand, 'lg');

  const handleChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Position header based on logo position
  const headerStyle = {
    backgroundColor: brand.colors.primary,
    justifyContent: logoPosition.includes('right') ? 'flex-end' : 'flex-start'
  };

  return (
    <div className="preview-frame presentation-preview" style={{ backgroundColor: brand.colors.background }}>
      <div className="slide-header" style={headerStyle}>
        {brand.logo && <img src={brand.logo} alt="" />}
      </div>
      <div className="slide-content" style={{ padding: margin }}>
        <EditableText
          tag="h2"
          value={fields.title?.value}
          onChange={(v) => handleChange('title', v)}
          placeholder="Präsentation"
          style={headlineStyle}
        />
        {fields.subtitle?.value && (
          <EditableText
            tag="p"
            value={fields.subtitle.value}
            onChange={(v) => handleChange('subtitle', v)}
            placeholder="Untertitel"
            className="slide-subtitle"
            style={bodyStyle}
          />
        )}
        <div className="slide-bullets" style={bodyStyle}>
          {['Punkt 1', 'Punkt 2', 'Punkt 3'].map((t, i) => (
            <div key={i} className="bullet"><span style={{ backgroundColor: brand.colors.accent }} />{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FlyerPreview({ brand, content, onFieldChange }) {
  const fields = content?.fields || {};
  const headlineStyle = { ...getHeadlineStyle(brand), color: brand.colors.text };
  const bodyStyle = getBodyStyle(brand);
  const logoPosition = getLogoPosition(brand);
  const margin = getSpacing(brand, 'md');

  const handleChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Header positioning based on logo position
  const headerStyle = {
    backgroundColor: brand.colors.primary,
    justifyContent: logoPosition.includes('right') ? 'flex-end' : 'flex-start'
  };

  return (
    <div className="preview-frame flyer-preview" style={{ backgroundColor: brand.colors.background }}>
      <div className="flyer-header" style={headerStyle}>
        {brand.logo && <img src={brand.logo} alt="" />}
      </div>
      {fields.image?.value ? (
        <img src={fields.image.value} alt="" className="flyer-image" />
      ) : (
        <ImagePlaceholder brand={brand} className="flyer-image-placeholder" />
      )}
      <div className="flyer-body" style={{ padding: margin }}>
        <EditableText
          tag="h2"
          value={fields.headline?.value}
          onChange={(v) => handleChange('headline', v)}
          placeholder="Flyer Titel"
          style={headlineStyle}
        />
        <EditableText
          tag="p"
          value={fields.description?.value}
          onChange={(v) => handleChange('description', v)}
          placeholder="Beschreibung"
          style={bodyStyle}
          multiline
        />
        <EditableText
          tag="div"
          className="flyer-cta"
          value={fields.cta?.value}
          onChange={(v) => handleChange('cta', v)}
          placeholder="Jetzt!"
          style={{ backgroundColor: brand.colors.accent }}
        />
      </div>
    </div>
  );
}

export function EmailPreview({ brand, content, onFieldChange }) {
  const fields = content?.fields || {};
  const headlineStyle = getHeadlineStyle(brand);
  const bodyStyle = getBodyStyle(brand);
  const logoPosition = getLogoPosition(brand);
  const margin = getSpacing(brand, 'lg');

  const handleChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Header positioning
  const headerStyle = {
    backgroundColor: brand.colors.primary,
    justifyContent: logoPosition.includes('right') ? 'flex-end' :
                    logoPosition === 'center' ? 'center' : 'flex-start'
  };

  return (
    <div className="preview-frame email-preview">
      <div className="email-header" style={headerStyle}>
        {brand.logo && <img src={brand.logo} alt="" />}
      </div>
      <div className="email-body" style={{ padding: margin }}>
        <EditableText
          tag="h2"
          value={fields.subject?.value}
          onChange={(v) => handleChange('subject', v)}
          placeholder="Newsletter Betreff"
          style={headlineStyle}
        />
        {fields.greeting?.value && (
          <EditableText
            tag="p"
            value={fields.greeting.value}
            onChange={(v) => handleChange('greeting', v)}
            placeholder="Anrede"
            className="email-greeting"
            style={bodyStyle}
          />
        )}
        <EditableText
          tag="p"
          value={fields.body?.value}
          onChange={(v) => handleChange('body', v)}
          placeholder="Inhalt hier..."
          style={bodyStyle}
          multiline
        />
        <EditableText
          tag="button"
          value={fields.cta?.value}
          onChange={(v) => handleChange('cta', v)}
          placeholder="Mehr"
          style={{ backgroundColor: brand.colors.primary }}
        />
      </div>
    </div>
  );
}

export function BusinessCardPreview({ brand, content, onFieldChange }) {
  const fields = content?.fields || {};
  const qrSvg = generateVCardQR(content, brand, { size: 50 });
  const headlineStyle = { ...getHeadlineStyle(brand), color: brand.colors.text };
  const bodyStyle = { ...getBodyStyle(brand), color: brand.colors.primary };
  const logoPosition = getLogoPosition(brand);

  const handleChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Position logo based on learned rules
  const logoClass = `card-logo card-logo-${logoPosition}`;

  return (
    <div className="preview-frame businesscard-preview">
      <div className="card-front" style={{ backgroundColor: brand.colors.background, borderColor: brand.colors.primary }}>
        {brand.logo && <img src={brand.logo} alt="" className={logoClass} />}
        <EditableText
          tag="div"
          className="card-name"
          value={fields.name?.value}
          onChange={(v) => handleChange('name', v)}
          placeholder="Max Mustermann"
          style={headlineStyle}
        />
        <EditableText
          tag="div"
          className="card-title"
          value={fields.title?.value}
          onChange={(v) => handleChange('title', v)}
          placeholder="Position"
          style={bodyStyle}
        />
      </div>
      <div className="card-back" style={{ backgroundColor: brand.colors.primary }}>
        <div className="card-contact">
          <EditableText
            tag="div"
            value={fields.phone?.value}
            onChange={(v) => handleChange('phone', v)}
            placeholder="+49 123 456"
          />
          <EditableText
            tag="div"
            value={fields.email?.value}
            onChange={(v) => handleChange('email', v)}
            placeholder="mail@firma.de"
          />
        </div>
        <div className="card-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
      </div>
    </div>
  );
}

export const previewComponents = {
  website: WebsitePreview,
  social: SocialPreview,
  presentation: PresentationPreview,
  flyer: FlyerPreview,
  email: EmailPreview,
  businesscard: BusinessCardPreview
};
