import React from 'react';

export default function SchemaModal({ schema, setSchema, onClose }) {
  
  // Logic to update specific fields without breaking the JSON structure
  const updateToken = (index, field, value) => {
    const newTokens = [...(schema.tokens || [])];
    let finalValue = value;
    
    // Type casting to ensure math logic in Stage 2/4 doesn't break
    if (field === 'id') finalValue = parseInt(value) || 0;
    if (field === 'weight') finalValue = parseFloat(value) || 0;

    newTokens[index] = { ...newTokens[index], [field]: finalValue };
    setSchema({ ...schema, tokens: newTokens });
  };

  const addToken = () => {
    const newToken = { word: "new_node", id: Math.floor(Math.random() * 1000), weight: 0.5 };
    setSchema({ ...schema, tokens: [...(schema.tokens || []), newToken] });
  };

  const removeToken = (index) => {
    const newTokens = schema.tokens.filter((_, i) => i !== index);
    setSchema({ ...schema, tokens: newTokens });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--blue)', letterSpacing: '0.1em' }}>
            ADVANCED_SCHEMA_EDITOR // NODE_CONFIG
          </span>
          <button onClick={onClose} style={closeButtonStyle}>[ CLOSE ]</button>
        </div>

        {/* Column Headers */}
        <div style={tableHeaderStyle}>
          <span>TOKEN_LABEL</span>
          <span>VECTOR_ID</span>
          <span>ATTN_WEIGHT</span>
          <span></span>
        </div>

        {/* Scrollable Token List */}
        <div style={{ padding: '0 20px 20px 20px', overflowY: 'auto', flex: 1 }}>
          {(schema.tokens || []).map((t, i) => (
            <div key={i} style={rowStyle}>
              <input 
                value={t.word} 
                onChange={(e) => updateToken(i, 'word', e.target.value)}
                style={inputStyle} 
              />
              <input 
                type="number"
                value={t.id} 
                onChange={(e) => updateToken(i, 'id', e.target.value)}
                style={inputStyle} 
              />
              <input 
                type="number"
                step="0.1"
                value={t.weight} 
                onChange={(e) => updateToken(i, 'weight', e.target.value)}
                style={inputStyle} 
              />
              <button onClick={() => removeToken(i)} style={deleteButtonStyle}>DEL</button>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={footerStyle}>
          <button onClick={addToken} style={addButtonStyle}>+ INSERT_NEW_NODE</button>
          <button onClick={onClose} style={commitButtonStyle}>COMMIT_CHANGES</button>
        </div>
      </div>
    </div>
  );
}

// --- STYLING (CachyOS / Dark Aesthetics) ---
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 3000, backdropFilter: 'blur(8px)'
};

const modalStyle = {
  width: 550, background: 'var(--bg2)', border: '1px solid var(--blue)',
  borderRadius: 4, display: 'flex', flexDirection: 'column', maxHeight: '70vh',
  boxShadow: '0 0 40px rgba(0, 212, 255, 0.15)'
};

const headerStyle = {
  padding: '16px 20px', borderBottom: '1px solid var(--border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)'
};

const tableHeaderStyle = {
  display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 50px', gap: 10,
  padding: '15px 20px 10px 20px', fontSize: 9, color: 'var(--text3)', fontWeight: 700
};

const rowStyle = {
  display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 50px', gap: 10,
  marginBottom: 8, alignItems: 'center'
};

const inputStyle = {
  background: 'var(--bg4)', border: '1px solid var(--border2)', color: 'var(--text1)',
  padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font)', borderRadius: 2, outline: 'none'
};

const closeButtonStyle = { background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 10, fontWeight: 700 };
const deleteButtonStyle = { background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 9, fontWeight: 700 };
const addButtonStyle = { background: 'none', border: '1px solid var(--green)', color: 'var(--green)', padding: '6px 12px', fontSize: 9, cursor: 'pointer', borderRadius: 2 };
const commitButtonStyle = { background: 'var(--blue)', border: 'none', color: '#000', padding: '6px 20px', fontSize: 10, fontWeight: 800, cursor: 'pointer', borderRadius: 2 };
const footerStyle = { padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg1)' };
