import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { generateCompleteAsset } from '../../lib/ai';

const campaignTypes = [
  { id: 'product-launch', name: 'Produktlaunch', icon: '🚀', description: 'Neues Produkt einführen' },
  { id: 'event', name: 'Event', icon: '📅', description: 'Veranstaltung bewerben' },
  { id: 'awareness', name: 'Awareness', icon: '📢', description: 'Markenbekanntheit steigern' },
  { id: 'promotion', name: 'Promotion', icon: '🏷️', description: 'Angebot oder Rabattaktion' },
  { id: 'recruiting', name: 'Recruiting', icon: '👥', description: 'Stellenanzeigen und Employer Branding' },
];

const channelOptions = [
  { id: 'website', name: 'Website', icon: '🌐' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'email', name: 'Newsletter', icon: '✉️' },
  { id: 'presentation', name: 'Präsentation', icon: '📊' },
  { id: 'flyer', name: 'Flyer', icon: '📄' },
];

export default function CampaignManager() {
  const { brandId } = useParams();
  const { getBrandById, updateAssetContent } = useBrandStore();
  const brand = getBrandById(brandId);

  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    type: '',
    name: '',
    objective: '',
    message: '',
    targetAudience: '',
    channels: [],
    briefing: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState({});
  const [progress, setProgress] = useState(0);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  const handleTypeSelect = (typeId) => {
    setCampaignData({ ...campaignData, type: typeId });
  };

  const toggleChannel = (channelId) => {
    const channels = campaignData.channels.includes(channelId)
      ? campaignData.channels.filter(c => c !== channelId)
      : [...campaignData.channels, channelId];
    setCampaignData({ ...campaignData, channels });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);

    const totalChannels = campaignData.channels.length;
    const results = {};

    const fullBriefing = `
Kampagnentyp: ${campaignTypes.find(t => t.id === campaignData.type)?.name}
Kampagnenname: ${campaignData.name}
Ziel: ${campaignData.objective}
Kernbotschaft: ${campaignData.message}
Zielgruppe: ${campaignData.targetAudience}

Briefing:
${campaignData.briefing}
    `.trim();

    for (let i = 0; i < campaignData.channels.length; i++) {
      const channel = campaignData.channels[i];
      try {
        const content = await generateCompleteAsset(brand, channel, fullBriefing);
        results[channel] = { success: true, content };

        // Save to asset content
        updateAssetContent(brandId, channel, { fields: { body: { value: content } } });
      } catch (error) {
        results[channel] = { success: false, error: error.message };
      }
      setProgress(Math.round(((i + 1) / totalChannels) * 100));
    }

    setGeneratedAssets(results);
    setGenerating(false);
    setStep(4);
  };

  return (
    <div className="campaign-manager">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Campaign Manager</h1>
          <p className="page-subtitle">Multi-Channel Kampagnen für {brand.name}</p>
        </div>
      </header>

      <div className="campaign-wizard">
        <div className="wizard-progress">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`wizard-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}
            >
              <span className="step-number">{s}</span>
              <span className="step-label">
                {s === 1 && 'Typ'}
                {s === 2 && 'Briefing'}
                {s === 3 && 'Channels'}
                {s === 4 && 'Generieren'}
              </span>
            </div>
          ))}
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <div className="wizard-step-content">
              <h2>Kampagnentyp wählen</h2>
              <p className="step-description">Was möchtest du bewerben?</p>

              <div className="campaign-types-grid">
                {campaignTypes.map(type => (
                  <button
                    key={type.id}
                    className={`campaign-type-card ${campaignData.type === type.id ? 'selected' : ''}`}
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-name">{type.name}</span>
                    <span className="type-desc">{type.description}</span>
                  </button>
                ))}
              </div>

              <div className="wizard-actions">
                <button
                  className="btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!campaignData.type}
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step-content">
              <h2>Kampagnen-Briefing</h2>
              <p className="step-description">Beschreibe deine Kampagne</p>

              <div className="briefing-form">
                <div className="form-group">
                  <label>Kampagnenname</label>
                  <input
                    type="text"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                    placeholder="z.B. Frühjahrs-Launch 2025"
                  />
                </div>

                <div className="form-group">
                  <label>Ziel der Kampagne</label>
                  <input
                    type="text"
                    value={campaignData.objective}
                    onChange={(e) => setCampaignData({ ...campaignData, objective: e.target.value })}
                    placeholder="z.B. 500 neue Leads generieren"
                  />
                </div>

                <div className="form-group">
                  <label>Kernbotschaft</label>
                  <input
                    type="text"
                    value={campaignData.message}
                    onChange={(e) => setCampaignData({ ...campaignData, message: e.target.value })}
                    placeholder="z.B. Innovation zum Anfassen"
                  />
                </div>

                <div className="form-group">
                  <label>Zielgruppe</label>
                  <input
                    type="text"
                    value={campaignData.targetAudience}
                    onChange={(e) => setCampaignData({ ...campaignData, targetAudience: e.target.value })}
                    placeholder="z.B. IT-Entscheider im Mittelstand"
                  />
                </div>

                <div className="form-group">
                  <label>Detailliertes Briefing</label>
                  <textarea
                    value={campaignData.briefing}
                    onChange={(e) => setCampaignData({ ...campaignData, briefing: e.target.value })}
                    placeholder="Beschreibe hier alle Details: Produkt/Service, USPs, Timing, besondere Anforderungen..."
                    rows={6}
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Zurück
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setStep(3)}
                  disabled={!campaignData.name || !campaignData.message}
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step-content">
              <h2>Channels auswählen</h2>
              <p className="step-description">Für welche Kanäle soll Content generiert werden?</p>

              <div className="channels-grid">
                {channelOptions.map(channel => (
                  <button
                    key={channel.id}
                    className={`channel-card ${campaignData.channels.includes(channel.id) ? 'selected' : ''}`}
                    onClick={() => toggleChannel(channel.id)}
                  >
                    <span className="channel-icon">{channel.icon}</span>
                    <span className="channel-name">{channel.name}</span>
                    {campaignData.channels.includes(channel.id) && (
                      <span className="channel-check">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="selected-channels">
                <strong>{campaignData.channels.length}</strong> Channels ausgewählt
              </div>

              <div className="wizard-actions">
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  Zurück
                </button>
                <button
                  className="btn-primary"
                  onClick={handleGenerate}
                  disabled={campaignData.channels.length === 0 || generating}
                >
                  {generating ? `Generiere... ${progress}%` : 'Content generieren'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step-content">
              <h2>Kampagne generiert!</h2>
              <p className="step-description">Content für alle Channels wurde erstellt</p>

              <div className="generated-results">
                {Object.entries(generatedAssets).map(([channel, result]) => (
                  <div
                    key={channel}
                    className={`result-card ${result.success ? 'success' : 'error'}`}
                  >
                    <div className="result-header">
                      <span className="result-icon">
                        {channelOptions.find(c => c.id === channel)?.icon}
                      </span>
                      <span className="result-channel">
                        {channelOptions.find(c => c.id === channel)?.name}
                      </span>
                      <span className="result-status">
                        {result.success ? '✓' : '✗'}
                      </span>
                    </div>
                    {result.success ? (
                      <div className="result-preview">
                        <pre>{result.content?.substring(0, 200)}...</pre>
                      </div>
                    ) : (
                      <div className="result-error">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="wizard-actions">
                <button className="btn-secondary" onClick={() => {
                  setStep(1);
                  setCampaignData({
                    type: '',
                    name: '',
                    objective: '',
                    message: '',
                    targetAudience: '',
                    channels: [],
                    briefing: ''
                  });
                  setGeneratedAssets({});
                }}>
                  Neue Kampagne
                </button>
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = `/brand/${brandId}/assets`}
                >
                  Assets bearbeiten
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
