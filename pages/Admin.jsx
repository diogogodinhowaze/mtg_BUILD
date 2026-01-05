import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllCustomCards, 
  getCustomCardById, 
  saveCustomCard, 
  deleteCustomCard, 
  createCustomCard,
  getDeletedCards,
  deleteCard,
  restoreCard,
  exportCustomCardsToJSON,
  importCustomCardsFromJSON
} from '../services/cardStorage';
import { searchCards, getCardByName } from '../services/mtgjsonApi';

export default function Admin() {
  const navigate = useNavigate();
  const [customCards, setCustomCards] = useState([]);
  const [deletedCards, setDeletedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' or 'deleted'

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mana_cost: '',
    cmc: 0,
    type_line: '',
    oracle_text: '',
    power: '',
    toughness: '',
    loyalty: '',
    rarity: 'common',
    set_name: 'Custom',
    set: 'CUSTOM',
    collector_number: '',
    color_identity: [],
    colors: [],
    keywords: [],
    image_uris: {}
  });
  const [imagePath, setImagePath] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCustomCards(getAllCustomCards());
    setDeletedCards(getDeletedCards());
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // CREATE
  const handleCreateCard = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedCard(null);
    setFormData({
      name: '',
      mana_cost: '',
      cmc: 0,
      type_line: '',
      oracle_text: '',
      power: '',
      toughness: '',
      loyalty: '',
      rarity: 'common',
      set_name: 'Custom',
      set: 'CUSTOM',
      collector_number: '',
      color_identity: [],
      colors: [],
      keywords: [],
      image_uris: {}
    });
    setImagePath('');
    setImagePreview(null);
  };

  const handleSaveNewCard = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showMessage('Card name is required', 'error');
      return;
    }

    // Parse CMC from mana cost if not provided
    let cmc = formData.cmc;
    if (!cmc && formData.mana_cost) {
      // Simple CMC calculation (count numbers and symbols)
      const manaCost = formData.mana_cost;
      const numbers = manaCost.match(/\d+/g);
      cmc = numbers ? numbers.reduce((sum, n) => sum + parseInt(n), 0) : 0;
      // Add 1 for each mana symbol (rough estimate)
      const symbolCount = (manaCost.match(/\{[^}]+\}/g) || []).length;
      cmc += symbolCount;
    }

    const cardData = {
      ...formData,
      cmc: cmc || 0,
      power: formData.power || null,
      toughness: formData.toughness || null,
      loyalty: formData.loyalty || null,
      collector_number: formData.collector_number || '',
      color_identity: Array.isArray(formData.color_identity) 
        ? formData.color_identity 
        : formData.color_identity.split(',').map(c => c.trim()).filter(c => c),
      colors: Array.isArray(formData.colors) 
        ? formData.colors 
        : formData.colors.split(',').map(c => c.trim()).filter(c => c),
      keywords: Array.isArray(formData.keywords) 
        ? formData.keywords 
        : formData.keywords.split(',').map(k => k.trim()).filter(k => k)
    };

    createCustomCard(cardData);
    showMessage(`Card "${cardData.name}" created successfully!`);
    setIsCreating(false);
    loadData();
    // Rebuild card indexes
    if (window.rebuildCardIndexes) {
      window.rebuildCardIndexes();
    }
  };

  // READ - View card details
  const handleViewCard = (cardId) => {
    const card = getCustomCardById(cardId);
    if (card) {
      setSelectedCard(card);
      setIsEditing(false);
      setIsCreating(false);
      setFormData({
        name: card.name || '',
        mana_cost: card.mana_cost || '',
        cmc: card.cmc || 0,
        type_line: card.type_line || '',
        oracle_text: card.oracle_text || '',
        power: card.power || '',
        toughness: card.toughness || '',
        loyalty: card.loyalty || '',
        rarity: card.rarity || 'common',
        set_name: card.set_name || 'Custom',
        set: card.set || 'CUSTOM',
        collector_number: card.collector_number || '',
        color_identity: card.color_identity || [],
        colors: card.colors || [],
        keywords: card.keywords || [],
        image_uris: card.image_uris || {}
      });
    }
  };

  // UPDATE
  const handleUpdateCard = (e) => {
    e.preventDefault();
    if (!selectedCard) return;

    if (!formData.name.trim()) {
      showMessage('Card name is required', 'error');
      return;
    }

    // Parse CMC
    let cmc = formData.cmc;
    if (!cmc && formData.mana_cost) {
      const manaCost = formData.mana_cost;
      const numbers = manaCost.match(/\d+/g);
      cmc = numbers ? numbers.reduce((sum, n) => sum + parseInt(n), 0) : 0;
      const symbolCount = (manaCost.match(/\{[^}]+\}/g) || []).length;
      cmc += symbolCount;
    }

    const updatedCard = {
      ...selectedCard,
      ...formData,
      cmc: cmc || 0,
      power: formData.power || null,
      toughness: formData.toughness || null,
      loyalty: formData.loyalty || null,
      color_identity: Array.isArray(formData.color_identity) 
        ? formData.color_identity 
        : formData.color_identity.split(',').map(c => c.trim()).filter(c => c),
      colors: Array.isArray(formData.colors) 
        ? formData.colors 
        : formData.colors.split(',').map(c => c.trim()).filter(c => c),
      keywords: Array.isArray(formData.keywords) 
        ? formData.keywords 
        : formData.keywords.split(',').map(k => k.trim()).filter(k => k)
    };

    saveCustomCard(updatedCard);
    showMessage(`Card "${updatedCard.name}" updated successfully!`);
    setIsEditing(false);
    loadData();
    setSelectedCard(updatedCard);
    // Rebuild card indexes
    if (window.rebuildCardIndexes) {
      window.rebuildCardIndexes();
    }
  };

  // DELETE
  const handleDeleteCard = (cardId) => {
    const card = getCustomCardById(cardId);
    if (!card) return;

    if (window.confirm(`Are you sure you want to delete "${card.name}"? This action cannot be undone.`)) {
      deleteCustomCard(cardId);
      showMessage(`Card "${card.name}" deleted successfully!`);
      if (selectedCard?.id === cardId) {
        setSelectedCard(null);
        setIsEditing(false);
      }
      loadData();
      // Rebuild card indexes
      if (window.rebuildCardIndexes) {
        window.rebuildCardIndexes();
      }
    }
  };

  // Delete MTGJSON card (hide it)
  const handleDeleteMTGJSONCard = async (cardName) => {
    const card = await getCardByName(cardName);
    if (card) {
      deleteCard(card.id);
      showMessage(`Card "${card.name}" hidden from searches!`);
      loadData();
      // Rebuild card indexes
      if (window.rebuildCardIndexes) {
        window.rebuildCardIndexes();
      }
    }
  };

  // Restore deleted card
  const handleRestoreCard = (cardId) => {
    restoreCard(cardId);
    showMessage('Card restored successfully!');
    loadData();
    // Rebuild card indexes
    if (window.rebuildCardIndexes) {
      window.rebuildCardIndexes();
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    if (selectedCard) {
      setFormData({
        name: selectedCard.name || '',
        mana_cost: selectedCard.mana_cost || '',
        cmc: selectedCard.cmc || 0,
        type_line: selectedCard.type_line || '',
        oracle_text: selectedCard.oracle_text || '',
        power: selectedCard.power || '',
        toughness: selectedCard.toughness || '',
        loyalty: selectedCard.loyalty || '',
        rarity: selectedCard.rarity || 'common',
        set_name: selectedCard.set_name || 'Custom',
        set: selectedCard.set || 'CUSTOM',
        collector_number: selectedCard.collector_number || '',
        color_identity: selectedCard.color_identity || [],
        colors: selectedCard.colors || [],
        keywords: selectedCard.keywords || [],
        image_uris: selectedCard.image_uris || {}
      });
      setImagePath(selectedCard.image_uris?.normal || '');
      setImagePreview(selectedCard.image_uris?.normal || null);
    }
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSearchCards = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchCards(searchTerm);
      setSearchResults(result.cards || []);
    } catch (error) {
      showMessage('Error searching cards: ' + error.message, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredCustomCards = customCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel - Card Management</h1>
          <button
            onClick={() => navigate('/')}
            className="back-to-home-button"
          >
            ← Back to Home
          </button>
        </div>

        {message && (
          <div className={`admin-message ${message.type}`}>
            {message.type === 'success' ? '✓' : '✗'} {message.text}
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Cards ({customCards.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'deleted' ? 'active' : ''}`}
            onClick={() => setActiveTab('deleted')}
          >
            Deleted Cards ({deletedCards.length})
          </button>
        </div>

        <div className="admin-content">
          {/* Left Panel - Card List */}
          <div className="admin-card-list-panel">
            <div className="panel-header">
              <h2>
                {activeTab === 'custom' ? 'Custom Cards' : 'Deleted Cards'}
              </h2>
              {activeTab === 'custom' && (
                <button
                  onClick={handleCreateCard}
                  className="create-button"
                >
                  + New Card
                </button>
              )}
            </div>

            {activeTab === 'custom' && (
              <>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search custom cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="card-list">
                  {filteredCustomCards.length === 0 ? (
                    <div className="empty-state">
                      {searchTerm ? 'No cards found matching your search.' : 'No custom cards yet. Create one to get started!'}
                    </div>
                  ) : (
                    filteredCustomCards.map(card => (
                      <div
                        key={card.id}
                        className={`card-item ${selectedCard?.id === card.id ? 'selected' : ''}`}
                        onClick={() => handleViewCard(card.id)}
                      >
                        <div className="card-item-header">
                          <h3>{card.name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(card.id);
                            }}
                            className="delete-button-small"
                            title="Delete card"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="card-item-info">
                          <span className="card-type">{card.type_line}</span>
                          <span className="card-mana">{card.mana_cost}</span>
                          {card.rarity && (
                            <span className={`rarity-badge rarity-${card.rarity}`}>
                              {card.rarity}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'deleted' && (
              <div className="card-list">
                {deletedCards.length === 0 ? (
                  <div className="empty-state">
                    No deleted cards. Deleted cards are hidden from searches.
                  </div>
                ) : (
                  <div className="deleted-cards-list">
                    {deletedCards.map(cardId => (
                      <div key={cardId} className="deleted-card-item">
                        <span>Card ID: {cardId}</span>
                        <button
                          onClick={() => handleRestoreCard(cardId)}
                          className="restore-button"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Card Details/Form */}
          <div className="admin-card-details-panel">
            {isCreating ? (
              <>
                <div className="panel-header">
                  <h2>Create New Card</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleSaveNewCard} className="card-form">
                  <div className="form-group">
                    <label htmlFor="name">Card Name *</label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="mana_cost">Mana Cost</label>
                      <input
                        id="mana_cost"
                        type="text"
                        value={formData.mana_cost}
                        onChange={(e) => setFormData({ ...formData, mana_cost: e.target.value })}
                        placeholder="{1}{R}"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cmc">CMC</label>
                      <input
                        id="cmc"
                        type="number"
                        value={formData.cmc}
                        onChange={(e) => setFormData({ ...formData, cmc: parseInt(e.target.value) || 0 })}
                        className="form-input"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="type_line">Type Line</label>
                    <input
                      id="type_line"
                      type="text"
                      value={formData.type_line}
                      onChange={(e) => setFormData({ ...formData, type_line: e.target.value })}
                      placeholder="Creature — Human Wizard"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="oracle_text">Oracle Text</label>
                    <textarea
                      id="oracle_text"
                      value={formData.oracle_text}
                      onChange={(e) => setFormData({ ...formData, oracle_text: e.target.value })}
                      className="form-textarea"
                      rows="4"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="power">Power</label>
                      <input
                        id="power"
                        type="text"
                        value={formData.power}
                        onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="toughness">Toughness</label>
                      <input
                        id="toughness"
                        type="text"
                        value={formData.toughness}
                        onChange={(e) => setFormData({ ...formData, toughness: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="loyalty">Loyalty</label>
                      <input
                        id="loyalty"
                        type="text"
                        value={formData.loyalty}
                        onChange={(e) => setFormData({ ...formData, loyalty: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="rarity">Rarity</label>
                      <select
                        id="rarity"
                        value={formData.rarity}
                        onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                        className="form-input"
                      >
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="mythic">Mythic</option>
                        <option value="special">Special</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="set">Set Code</label>
                      <input
                        id="set"
                        type="text"
                        value={formData.set}
                        onChange={(e) => setFormData({ ...formData, set: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="colors">Colors (comma-separated: W, U, B, R, G)</label>
                    <input
                      id="colors"
                      type="text"
                      value={Array.isArray(formData.colors) ? formData.colors.join(', ') : formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="R, G"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color_identity">Color Identity (comma-separated)</label>
                    <input
                      id="color_identity"
                      type="text"
                      value={Array.isArray(formData.color_identity) ? formData.color_identity.join(', ') : formData.color_identity}
                      onChange={(e) => setFormData({ ...formData, color_identity: e.target.value })}
                      placeholder="R, G"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="keywords">Keywords (comma-separated)</label>
                    <input
                      id="keywords"
                      type="text"
                      value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="Flying, Haste"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group image-upload-section">
                    <label>Card Image</label>
                    <div className="image-upload-buttons">
                      <input
                        type="file"
                        accept="image/*"
                        id="image-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const imageUrl = reader.result;
                              setImagePreview(imageUrl);
                              setFormData({
                                ...formData,
                                image_uris: { normal: imageUrl, large: imageUrl, small: imageUrl }
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="image-upload" className="image-upload-button" style={{ cursor: 'pointer' }}>
                        📷 Upload Image
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Or enter image URL/path"
                      value={imagePath}
                      onChange={(e) => {
                        setImagePath(e.target.value);
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                          setFormData({
                            ...formData,
                            image_uris: { normal: e.target.value, large: e.target.value, small: e.target.value }
                          });
                        }
                      }}
                      className="form-input image-path-input"
                    />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="image-preview" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-button">
                      Create Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : selectedCard ? (
              <>
                <div className="panel-header">
                  <h2>Card Details</h2>
                  {!isEditing && (
                    <button
                      onClick={handleEditClick}
                      className="edit-button"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateCard} className="card-form">
                    <div className="form-group">
                      <label htmlFor="edit-name">Card Name *</label>
                      <input
                        id="edit-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-mana_cost">Mana Cost</label>
                        <input
                          id="edit-mana_cost"
                          type="text"
                          value={formData.mana_cost}
                          onChange={(e) => setFormData({ ...formData, mana_cost: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-cmc">CMC</label>
                        <input
                          id="edit-cmc"
                          type="number"
                          value={formData.cmc}
                          onChange={(e) => setFormData({ ...formData, cmc: parseInt(e.target.value) || 0 })}
                          className="form-input"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-type_line">Type Line</label>
                      <input
                        id="edit-type_line"
                        type="text"
                        value={formData.type_line}
                        onChange={(e) => setFormData({ ...formData, type_line: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-oracle_text">Oracle Text</label>
                      <textarea
                        id="edit-oracle_text"
                        value={formData.oracle_text}
                        onChange={(e) => setFormData({ ...formData, oracle_text: e.target.value })}
                        className="form-textarea"
                        rows="4"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-power">Power</label>
                        <input
                          id="edit-power"
                          type="text"
                          value={formData.power}
                          onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-toughness">Toughness</label>
                        <input
                          id="edit-toughness"
                          type="text"
                          value={formData.toughness}
                          onChange={(e) => setFormData({ ...formData, toughness: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-loyalty">Loyalty</label>
                        <input
                          id="edit-loyalty"
                          type="text"
                          value={formData.loyalty}
                          onChange={(e) => setFormData({ ...formData, loyalty: e.target.value })}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-rarity">Rarity</label>
                        <select
                          id="edit-rarity"
                          value={formData.rarity}
                          onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                          className="form-input"
                        >
                          <option value="common">Common</option>
                          <option value="uncommon">Uncommon</option>
                          <option value="rare">Rare</option>
                          <option value="mythic">Mythic</option>
                          <option value="special">Special</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-set">Set Code</label>
                        <input
                          id="edit-set"
                          type="text"
                          value={formData.set}
                          onChange={(e) => setFormData({ ...formData, set: e.target.value })}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-colors">Colors (comma-separated)</label>
                      <input
                        id="edit-colors"
                        type="text"
                        value={Array.isArray(formData.colors) ? formData.colors.join(', ') : formData.colors}
                        onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-color_identity">Color Identity (comma-separated)</label>
                      <input
                        id="edit-color_identity"
                        type="text"
                        value={Array.isArray(formData.color_identity) ? formData.color_identity.join(', ') : formData.color_identity}
                        onChange={(e) => setFormData({ ...formData, color_identity: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-keywords">Keywords (comma-separated)</label>
                      <input
                        id="edit-keywords"
                        type="text"
                        value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group image-upload-section">
                      <label>Card Image</label>
                      <div className="image-upload-buttons">
                        <input
                          type="file"
                          accept="image/*"
                          id="image-upload-edit"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const imageUrl = reader.result;
                                setImagePreview(imageUrl);
                                setFormData({
                                  ...formData,
                                  image_uris: { normal: imageUrl, large: imageUrl, small: imageUrl }
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="image-upload-edit" className="image-upload-button" style={{ cursor: 'pointer' }}>
                          📷 Upload Image
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Or enter image URL/path"
                        value={imagePath}
                        onChange={(e) => {
                          setImagePath(e.target.value);
                          if (e.target.value) {
                            setImagePreview(e.target.value);
                            setFormData({
                              ...formData,
                              image_uris: { normal: e.target.value, large: e.target.value, small: e.target.value }
                            });
                          }
                        }}
                        className="form-input image-path-input"
                      />
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="image-preview" onError={(e) => { e.target.style.display = 'none'; }} />
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-button">
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="card-details">
                    <div className="detail-row">
                      <strong>Name:</strong>
                      <span>{selectedCard.name}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Mana Cost:</strong>
                      <span>{selectedCard.mana_cost || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <strong>CMC:</strong>
                      <span>{selectedCard.cmc}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Type:</strong>
                      <span>{selectedCard.type_line || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Oracle Text:</strong>
                      <span className="oracle-text-display">{selectedCard.oracle_text || '—'}</span>
                    </div>
                    {(selectedCard.power || selectedCard.toughness) && (
                      <div className="detail-row">
                        <strong>Power/Toughness:</strong>
                        <span>{selectedCard.power || '—'}/{selectedCard.toughness || '—'}</span>
                      </div>
                    )}
                    {selectedCard.loyalty && (
                      <div className="detail-row">
                        <strong>Loyalty:</strong>
                        <span>{selectedCard.loyalty}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>Rarity:</strong>
                      <span className={`rarity-badge rarity-${selectedCard.rarity}`}>
                        {selectedCard.rarity}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Set:</strong>
                      <span>{selectedCard.set} - {selectedCard.set_name}</span>
                    </div>
                    {selectedCard.colors && selectedCard.colors.length > 0 && (
                      <div className="detail-row">
                        <strong>Colors:</strong>
                        <span>{selectedCard.colors.join(', ')}</span>
                      </div>
                    )}
                    {selectedCard.color_identity && selectedCard.color_identity.length > 0 && (
                      <div className="detail-row">
                        <strong>Color Identity:</strong>
                        <span>{selectedCard.color_identity.join(', ')}</span>
                      </div>
                    )}
                    {selectedCard.keywords && selectedCard.keywords.length > 0 && (
                      <div className="detail-row">
                        <strong>Keywords:</strong>
                        <span>{selectedCard.keywords.join(', ')}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>Created:</strong>
                      <span>{selectedCard.createdAt ? new Date(selectedCard.createdAt).toLocaleString() : '—'}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Last Updated:</strong>
                      <span>{selectedCard.updatedAt ? new Date(selectedCard.updatedAt).toLocaleString() : '—'}</span>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => handleDeleteCard(selectedCard.id)}
                        className="delete-deck-button"
                      >
                        Delete Card
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection">
                <p>Select a card from the list to view details, or create a new card</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
