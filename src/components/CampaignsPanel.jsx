import React, { useState, useEffect } from 'react';
import { CampaignStore, campaignTemplates, campaignStatuses, getCampaignProgress } from '../lib/campaigns.js';

export default function CampaignsPanel({ brand, onSelectCampaign }) {
  const [store] = useState(() => new CampaignStore());
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', topic: '', template: null });

  useEffect(() => {
    setCampaigns(store.getByBrand(brand.id));
  }, [brand.id]);

  const handleCreate = () => {
    const campaign = store.create(brand, newCampaign);
    setCampaigns(store.getByBrand(brand.id));
    setShowCreate(false);
    setNewCampaign({ name: '', topic: '', template: null });
    if (onSelectCampaign) onSelectCampaign(campaign);
  };

  const handleDelete = (id) => {
    store.delete(id);
    setCampaigns(store.getByBrand(brand.id));
  };

  return (
    <div className="campaigns-panel">
      <div className="campaigns-header">
        <h3>Kampagnen</h3>
        <button className="btn-add" onClick={() => setShowCreate(true)}>+</button>
      </div>

      {showCreate && (
        <div className="campaign-create">
          <h4>Neue Kampagne</h4>

          <div className="template-select">
            {campaignTemplates.map(tpl => (
              <button
                key={tpl.id}
                className={newCampaign.template === tpl.id ? 'active' : ''}
                onClick={() => setNewCampaign({ ...newCampaign, template: tpl.id, name: tpl.name })}
              >
                <span>{tpl.icon}</span>
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>

          <input
            type="text"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            placeholder="Kampagnenname"
          />

          <textarea
            value={newCampaign.topic}
            onChange={(e) => setNewCampaign({ ...newCampaign, topic: e.target.value })}
            placeholder="Thema / Briefing (fur AI-Generierung)"
          />

          <div className="campaign-create-actions">
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Abbrechen</button>
            <button className="btn-primary" onClick={handleCreate}>Erstellen</button>
          </div>
        </div>
      )}

      <div className="campaigns-list">
        {campaigns.map(campaign => {
          const progress = getCampaignProgress(campaign);
          const status = campaignStatuses[campaign.status];

          return (
            <div
              key={campaign.id}
              className="campaign-item"
              onClick={() => onSelectCampaign && onSelectCampaign(campaign)}
            >
              <div className="campaign-info">
                <span className="campaign-name">{campaign.name}</span>
                <span className="campaign-status" style={{ color: status.color }}>
                  {status.icon} {status.label}
                </span>
              </div>
              <div className="campaign-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${progress.percentage}%` }}
                />
                <span>{progress.completed}/{progress.total}</span>
              </div>
              <button
                className="btn-delete-campaign"
                onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}
              >
                x
              </button>
            </div>
          );
        })}

        {campaigns.length === 0 && !showCreate && (
          <div className="campaigns-empty">
            Noch keine Kampagnen. Erstelle deine erste!
          </div>
        )}
      </div>
    </div>
  );
}
