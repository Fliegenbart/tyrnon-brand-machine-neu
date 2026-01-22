import React, { useState } from 'react';

export default function BrandSidebar({
  brands,
  activeBrand,
  onSelectBrand,
  onCreateBrand,
  onDeleteBrand,
  onUpdateBrand,
  onlineUsers = []
}) {
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editName, setEditName] = useState('');

  const getUsersForBrand = (brandId) => {
    return onlineUsers.filter(u => u.active_brand_id === brandId);
  };

  const startEditing = (brand, e) => {
    e.stopPropagation();
    setEditingBrandId(brand.id);
    setEditName(brand.name);
  };

  const saveEdit = (brand) => {
    if (editName.trim() && editName !== brand.name) {
      onUpdateBrand({ ...brand, name: editName.trim() });
    }
    setEditingBrandId(null);
    setEditName('');
  };

  const handleKeyDown = (e, brand) => {
    if (e.key === 'Enter') {
      saveEdit(brand);
    } else if (e.key === 'Escape') {
      setEditingBrandId(null);
      setEditName('');
    }
  };

  return (
    <div className="brand-sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark-small">T</div>
        <div className="logo-text">
          <span className="logo-name">TYRN.ON</span>
          <span className="logo-sub">Brand Engine</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <span>Marken</span>
          <button className="btn-add-brand" onClick={onCreateBrand} title="Neue Marke">
            +
          </button>
        </div>

        <div className="brand-list">
          {brands.map(brand => {
            const usersOnBrand = getUsersForBrand(brand.id);
            const isEditing = editingBrandId === brand.id;

            return (
              <div
                key={brand.id}
                className={`brand-item ${activeBrand?.id === brand.id ? 'active' : ''}`}
                onClick={() => !isEditing && onSelectBrand(brand)}
              >
                <div className="brand-item-main">
                  <div
                    className="brand-color-indicator"
                    style={{ backgroundColor: brand.colors.primary }}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(brand)}
                      onKeyDown={(e) => handleKeyDown(e, brand)}
                      onClick={(e) => e.stopPropagation()}
                      className="brand-name-edit"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="brand-name"
                      onDoubleClick={(e) => startEditing(brand, e)}
                      title="Doppelklick zum Bearbeiten"
                    >
                      {brand.name}
                    </span>
                  )}
                  <div className="brand-actions">
                    {!isEditing && (
                      <button
                        className="btn-edit-brand"
                        onClick={(e) => startEditing(brand, e)}
                        title="Umbenennen"
                      >
                        ...
                      </button>
                    )}
                    {brands.length > 1 && (
                      <button
                        className="btn-delete-brand"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${brand.name}" wirklich löschen?`)) {
                            onDeleteBrand(brand.id);
                          }
                        }}
                        title="Löschen"
                      >
                        x
                      </button>
                    )}
                  </div>
                </div>

                {usersOnBrand.length > 0 && (
                  <div className="brand-activity">
                    {usersOnBrand.slice(0, 3).map(user => (
                      <div
                        key={user.user_id}
                        className="activity-avatar"
                        style={{ backgroundColor: user.user_color }}
                        title={user.user_name}
                      >
                        {user.user_name.charAt(0)}
                      </div>
                    ))}
                    {usersOnBrand.length > 3 && (
                      <span className="activity-more">+{usersOnBrand.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-count">
          {onlineUsers.length > 0 && (
            <span>{onlineUsers.length} online</span>
          )}
        </div>
      </div>
    </div>
  );
}
