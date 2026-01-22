import React from 'react';
import { defaultContent } from '../lib/content.js';

export default function ContentEditor({ assetType, content, onChange, brand }) {
  const template = defaultContent[assetType];
  if (!template) return null;

  const handleFieldChange = (fieldKey, value) => {
    onChange({
      ...content,
      fields: {
        ...content.fields,
        [fieldKey]: {
          ...content.fields?.[fieldKey],
          value
        }
      }
    });
  };

  return (
    <div className="content-editor">
      <h3>Inhalte bearbeiten</h3>
      {Object.entries(template.fields).map(([key, field]) => (
        <div key={key} className="content-field">
          <label>{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              value={content.fields?.[key]?.value || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
            />
          ) : field.type === 'array' ? (
            <div className="array-field">
              {(content.fields?.[key]?.value || field.value || []).map((item, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArr = [...(content.fields?.[key]?.value || field.value)];
                    newArr[idx] = e.target.value;
                    handleFieldChange(key, newArr);
                  }}
                />
              ))}
              <button
                className="btn-add-item"
                onClick={() => {
                  const current = content.fields?.[key]?.value || field.value || [];
                  handleFieldChange(key, [...current, '']);
                }}
              >
                + Hinzufugen
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={content.fields?.[key]?.value || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
            />
          )}
        </div>
      ))}
    </div>
  );
}
