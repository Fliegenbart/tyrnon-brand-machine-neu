import React, { useState } from 'react';
import { generateQRCode, qrCodeTypes } from '../lib/qrcode.js';

export default function QRCodeGenerator({ brand, content }) {
  const [qrType, setQrType] = useState('url');
  const [qrValue, setQrValue] = useState('');
  const [qrSvg, setQrSvg] = useState('');

  const handleGenerate = () => {
    if (!qrValue.trim()) return;

    const type = qrCodeTypes[qrType];
    const formattedValue = type.format(qrValue);
    const svg = generateQRCode(formattedValue, {
      darkColor: brand.colors.primary,
      size: 150
    });
    setQrSvg(svg);
  };

  return (
    <div className="qr-generator">
      <h4>QR-Code</h4>

      <div className="qr-type-select">
        {Object.entries(qrCodeTypes).slice(0, 4).map(([key, type]) => (
          <button
            key={key}
            className={qrType === key ? 'active' : ''}
            onClick={() => setQrType(key)}
          >
            {type.icon} {type.name}
          </button>
        ))}
      </div>

      <div className="qr-input">
        <input
          type="text"
          value={qrValue}
          onChange={(e) => setQrValue(e.target.value)}
          placeholder={qrCodeTypes[qrType].placeholder}
        />
        <button onClick={handleGenerate}>Erstellen</button>
      </div>

      {qrSvg && (
        <div
          className="qr-preview"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      )}
    </div>
  );
}
