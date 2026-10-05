import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ExternalLink, RotateCcw, Search } from 'lucide-react';

export interface DirectoryLinkItem {
  id: string;
  name: string;
  url: string;
  category: 'doctor' | 'pharmacy' | 'resources';
  logoColor: string;
  logoLetter: string;
  logoBadge?: string;
}

export const INITIAL_DIRECTORY_LINKS: DirectoryLinkItem[] = [
  // 1. Doctor Search Links
  { id: 'doc_humana', name: 'Humana/Careplus', url: 'https://www.humana.com/finder/medical', category: 'doctor', logoColor: '#00823B', logoLetter: 'H' },
  { id: 'doc_uhc', name: 'UHC Provider Search', url: 'https://www.uhc.com/find-a-doctor', category: 'doctor', logoColor: '#002677', logoLetter: 'UHC' },
  { id: 'doc_aetna', name: 'Aetna', url: 'https://www.aetna.com/dsepublic/#/welcome', category: 'doctor', logoColor: '#7D3F98', logoLetter: 'A' },
  { id: 'doc_uhc_dental', name: 'UHC Dental', url: 'https://www.uhcdental.com', category: 'doctor', logoColor: '#002677', logoLetter: 'UD' },
  { id: 'doc_uhc_opt', name: 'UHC Optometry', url: 'https://www.uhc.com/vision', category: 'doctor', logoColor: '#002677', logoLetter: 'UO' },
  { id: 'doc_healthsprings', name: 'Healthsprings', url: 'https://www.cigna.com/medicare/healthspring', category: 'doctor', logoColor: '#7B1FA2', logoLetter: 'HS' },
  { id: 'doc_wellpoint', name: 'Wellpoint', url: 'https://www.wellpoint.com/find-care', category: 'doctor', logoColor: '#E91E63', logoLetter: 'WP' },
  { id: 'doc_anthem', name: 'Anthem', url: 'https://www.anthem.com/find-care/', category: 'doctor', logoColor: '#005596', logoLetter: 'AN' },
  { id: 'doc_wellcare', name: 'WellCare', url: 'https://www.wellcare.com/en/find-a-provider', category: 'doctor', logoColor: '#004B87', logoLetter: 'WC' },
  { id: 'doc_zing', name: 'Zing', url: 'https://www.myzinghealth.com/find-a-doctor', category: 'doctor', logoColor: '#2E7D32', logoLetter: 'Z' },
  { id: 'doc_simply', name: 'Simply', url: 'https://www.simplyhealthcareplans.com/find-care', category: 'doctor', logoColor: '#0288D1', logoLetter: 'SH' },

  // 2. RX & Pharmacy
  { id: 'rx_humana', name: 'Humana Pharmacy', url: 'https://www.centerwellpharmacy.com/', category: 'pharmacy', logoColor: '#00823B', logoLetter: 'H' },
  { id: 'rx_uhcjarvis', name: 'www.uhcjarvis.com', url: 'https://www.uhcjarvis.com', category: 'pharmacy', logoColor: '#002677', logoLetter: 'UHC' },
  { id: 'rx_aetna', name: 'www.aetna.com', url: 'https://www.aetna.com/individuals-families/find-a-medication.html', category: 'pharmacy', logoColor: '#7D3F98', logoLetter: 'A' },
  { id: 'rx_wellpoint', name: 'shop.wellpoint.com', url: 'https://shop.wellpoint.com', category: 'pharmacy', logoColor: '#E91E63', logoLetter: 'WP' },
  { id: 'rx_wellcare_isf', name: 'wellcare.isf.io', url: 'https://wellcare.isf.io', category: 'pharmacy', logoColor: '#004B87', logoLetter: 'WC' },
  { id: 'rx_zing', name: 'Zing', url: 'https://www.myzinghealth.com/pharmacy', category: 'pharmacy', logoColor: '#2E7D32', logoLetter: 'Z' },

  // 3. Additional Resources
  { id: 'res_gtl', name: 'All GTL Brochures', url: 'https://www.gtlic.com', category: 'resources', logoColor: '#00897B', logoLetter: 'GTL' },
  { id: 'res_athos', name: 'Athos AI', url: 'https://app.useathos.ai', category: 'resources', logoColor: '#37474F', logoLetter: 'AI' },
  { id: 'res_salesboards', name: 'SALES BOARDS', url: 'https://omkarr-my.sharepoint.com', category: 'resources', logoColor: '#0078d4', logoLetter: 'OIH' },
  { id: 'res_signify', name: 'Signify', url: 'https://www.signifyhealth.com', category: 'resources', logoColor: '#43A047', logoLetter: 'SIG' },
  { id: 'res_outlook', name: 'Outlook', url: 'https://outlook.office.com', category: 'resources', logoColor: '#0078d4', logoLetter: 'O' },
  { id: 'res_commissions', name: 'GHE Commission Projection Studio', url: 'https://omkarr-my.sharepoint.com/commissions', category: 'resources', logoColor: '#005a9e', logoLetter: 'CPS' },
  { id: 'res_adp', name: 'ADP', url: 'https://my.adp.com', category: 'resources', logoColor: '#D32F2F', logoLetter: 'ADP' }
];

interface ProviderDirectoryProps {
  onLinkCountChange?: (items: DirectoryLinkItem[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export default function ProviderDirectory({ onLinkCountChange, onConfirmDelete, showToast }: ProviderDirectoryProps) {
  const [items, setItems] = useState<DirectoryLinkItem[]>(() => {
    try {
      const saved = localStorage.getItem('omkarr_provider_directory_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_DIRECTORY_LINKS;
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    category: 'doctor' | 'pharmacy' | 'resources';
    editingItem?: DirectoryLinkItem | null;
  }>({ isOpen: false, category: 'doctor', editingItem: null });

  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formColor, setFormColor] = useState('#0078d4');
  const [formLetter, setFormLetter] = useState('');

  useEffect(() => {
    localStorage.setItem('omkarr_provider_directory_v1', JSON.stringify(items));
    if (onLinkCountChange) onLinkCountChange(items);
  }, [items]);

  const openAddModal = (category: 'doctor' | 'pharmacy' | 'resources') => {
    setModalState({ isOpen: true, category, editingItem: null });
    setFormName('');
    setFormUrl('https://');
    setFormColor(category === 'doctor' ? '#00823B' : category === 'pharmacy' ? '#004B87' : '#0078d4');
    setFormLetter('');
  };

  const openEditModal = (item: DirectoryLinkItem) => {
    setModalState({ isOpen: true, category: item.category, editingItem: item });
    setFormName(item.name);
    setFormUrl(item.url);
    setFormColor(item.logoColor);
    setFormLetter(item.logoLetter);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    const letter = formLetter.trim() || formName.trim().substring(0, 2).toUpperCase();

    if (modalState.editingItem) {
      setItems(prev => prev.map(i => i.id === modalState.editingItem!.id ? {
        ...i,
        name: formName.trim(),
        url: formUrl.trim(),
        logoColor: formColor,
        logoLetter: letter
      } : i));
      showToast(`Updated "${formName}"`);
    } else {
      const newItem: DirectoryLinkItem = {
        id: 'link_' + Date.now(),
        name: formName.trim(),
        url: formUrl.trim(),
        category: modalState.category,
        logoColor: formColor,
        logoLetter: letter
      };
      setItems(prev => [...prev, newItem]);
      showToast(`Added "${formName}"`);
    }

    setModalState({ isOpen: false, category: 'doctor', editingItem: null });
  };

  const handleDeleteItem = (item: DirectoryLinkItem) => {
    onConfirmDelete(
      `Delete Link: ${item.name}`,
      `Remove "${item.name}" from ${item.category === 'doctor' ? 'Doctor Search Links' : item.category === 'pharmacy' ? 'RX & Pharmacy' : 'Additional Resources'}?`,
      () => {
        setItems(prev => prev.filter(i => i.id !== item.id));
        showToast(`Removed "${item.name}"`);
      }
    );
  };

  const handleReset = () => {
    onConfirmDelete(
      'Reset Provider & RX Directory',
      'Restore Doctor Search, RX & Pharmacy, and Additional Resources back to original defaults?',
      () => {
        setItems(INITIAL_DIRECTORY_LINKS);
        showToast('Directory reset to original links');
      }
    );
  };

  const renderColumn = (title: string, category: 'doctor' | 'pharmacy' | 'resources') => {
    const colItems = items.filter(i => i.category === category);
    return (
      <div className="sp-dir-col">
        <div className="sp-dir-col-header">
          <h3>{title}</h3>
          <span className="sp-dir-count">{colItems.length}</span>
        </div>

        <div className="sp-dir-list">
          {colItems.map(item => (
            <div key={item.id} className="sp-dir-row">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="sp-dir-link"
                title={`Open ${item.name}`}
              >
                <div className="sp-dir-logo-sq" style={{ backgroundColor: item.logoColor }}>
                  {item.logoLetter}
                </div>
                <span className="sp-dir-name">{item.name}</span>
                <ExternalLink size={12} className="sp-dir-ext" />
              </a>

              <div className="sp-dir-row-actions">
                <button 
                  type="button" 
                  className="sp-dir-action-btn"
                  onClick={() => openEditModal(item)}
                  title="Edit link"
                >
                  <Edit3 size={13} />
                </button>
                <button 
                  type="button" 
                  className="sp-dir-action-btn del"
                  onClick={() => handleDeleteItem(item)}
                  title="Remove link"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          className="sp-dir-add-btn"
          onClick={() => openAddModal(category)}
        >
          <Plus size={14} />
          <span>Add to {title}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="sp-dir-container">
      <style>{`
        .sp-dir-container {
          margin-top: 10px;
          margin-bottom: 30px;
        }
        .sp-dir-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .sp-dir-heading h2 {
          font-size: 20px;
          font-weight: 700;
          color: #002050;
        }
        .sp-dir-heading p {
          font-size: 13px;
          color: #605e5c;
        }
        .sp-dir-reset-btn {
          background: #ffffff;
          border: 1px solid #e1dfdd;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          color: #605e5c;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sp-dir-reset-btn:hover { background: #f3f2f1; color: #002050; }

        .sp-dir-columns-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          background: #ffffff;
          border: 1px solid #e1dfdd;
          border-radius: 4px;
          padding: 24px;
          box-shadow: 0 1.6px 3.6px rgba(0,0,0,0.06);
        }
        @media (max-width: 992px) {
          .sp-dir-columns-grid { grid-template-columns: 1fr; gap: 28px; }
        }

        .sp-dir-col { display: flex; flex-direction: column; }
        .sp-dir-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #edebe9;
          margin-bottom: 12px;
        }
        .sp-dir-col-header h3 {
          font-size: 17px;
          font-weight: 700;
          color: #002050;
        }
        .sp-dir-count {
          font-size: 11px;
          background: #edebe9;
          color: #605e5c;
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 600;
        }

        .sp-dir-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
          min-height: 200px;
        }
        .sp-dir-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 4px;
          transition: background 0.12s;
        }
        .sp-dir-row:hover {
          background: #f3f2f1;
        }
        .sp-dir-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #323130;
          font-size: 13.5px;
          font-weight: 500;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-dir-link:hover .sp-dir-name {
          color: #0078d4;
          text-decoration: underline;
        }
        .sp-dir-logo-sq {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sp-dir-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-dir-ext {
          opacity: 0;
          color: #a19f9d;
          transition: opacity 0.15s;
        }
        .sp-dir-row:hover .sp-dir-ext { opacity: 1; }

        .sp-dir-row-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.6;
        }
        .sp-dir-row:hover .sp-dir-row-actions { opacity: 1; }
        .sp-dir-action-btn {
          background: transparent;
          border: none;
          color: #605e5c;
          padding: 4px;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-dir-action-btn:hover { background: #edebe9; color: #002050; }
        .sp-dir-action-btn.del:hover { background: #d13438; color: #ffffff; }

        .sp-dir-add-btn {
          background: #f3f2f1;
          border: 1px dashed #c8c6c4;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12.5px;
          font-weight: 600;
          color: #002050;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: auto;
          transition: all 0.15s;
        }
        .sp-dir-add-btn:hover {
          background: #edebe9;
          border-color: #0078d4;
          color: #0078d4;
        }
      `}</style>

      <div className="sp-dir-top-bar">
        <div className="sp-dir-heading">
          <h2>Provider Search, RX & Resources Hub</h2>
          <p>Direct access to verified doctor directories, drug formularies, and agent tools</p>
        </div>
        <button type="button" className="sp-dir-reset-btn" onClick={handleReset}>
          <RotateCcw size={13} />
          <span>Reset Directory</span>
        </button>
      </div>

      <div className="sp-dir-columns-grid">
        {renderColumn('Doctor Search Links', 'doctor')}
        {renderColumn('RX & Pharmacy', 'pharmacy')}
        {renderColumn('Additional Resources', 'resources')}
      </div>

      {modalState.isOpen && (
        <div className="sp-modal-overlay" onClick={() => setModalState({ ...modalState, isOpen: false })}>
          <div className="sp-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                {modalState.editingItem ? 'Edit Directory Link' : `Add Link to ${modalState.category === 'doctor' ? 'Doctor Search' : modalState.category === 'pharmacy' ? 'RX & Pharmacy' : 'Additional Resources'}`}
              </h3>
              <button 
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="sp-modal-form">
              <div className="sp-form-group">
                <label>Link / Carrier Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Humana/Careplus, UHC Dental, CenterWell"
                  className="sp-form-input"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Direct Web Link (URL) *</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://..."
                  className="sp-form-input"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="sp-form-group">
                  <label>Square Logo Color</label>
                  <input 
                    type="color" 
                    className="sp-form-input"
                    style={{ height: '38px', padding: '2px', cursor: 'pointer' }}
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                  />
                </div>
                <div className="sp-form-group">
                  <label>Logo Abbreviation (1-3 chars)</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    placeholder="e.g. H, UHC, Z"
                    className="sp-form-input"
                    value={formLetter}
                    onChange={e => setFormLetter(e.target.value)}
                  />
                </div>
              </div>

              <div className="sp-modal-footer" style={{ margin: '0 -20px -20px -20px' }}>
                <button 
                  type="button" 
                  className="sp-btn-secondary" 
                  onClick={() => setModalState({ ...modalState, isOpen: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="sp-btn-primary">
                  {modalState.editingItem ? 'Save Changes' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
