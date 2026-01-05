import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DeckList from '../components/DeckList';
import { getAllDecks, createDeck, deleteDeck, exportAllDecksToJSON, importDecksFromJSON, importDeckFromTXT, importDeckFromTXTContent } from '../services/deckStorage';
import { getCardByName, loadMTGJSONData } from '../services/mtgjsonApi';

export default function Decks() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importPasteText, setImportPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDecks();
    // Load MTGJSON data on component mount
    loadMTGJSONData().catch(err => {
      console.error('Failed to load MTGJSON data:', err);
    });
  }, []);

  const loadDecks = () => {
    const allDecks = getAllDecks();
    // Sort by updated date, newest first
    allDecks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setDecks(allDecks);
  };

  const handleCreateDeck = (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    const newDeck = createDeck(newDeckName.trim());
    setNewDeckName('');
    setShowCreateForm(false);
    navigate(`/deck/${newDeck.id}`);
  };

  const handleDeleteDeck = (deckId) => {
    deleteDeck(deckId);
    loadDecks();
  };

  const handleExportAll = () => {
    exportAllDecksToJSON();
  };

  const handleImportClick = () => {
    setShowImportOptions(true);
  };

  const handleFileImportClick = () => {
    fileInputRef.current?.click();
    setShowImportOptions(false);
  };

  const showNotification = (message, type = 'success') => {
    setImportMessage({ message, type });
    setTimeout(() => {
      setImportMessage(null);
    }, 4000);
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      if (file.name.endsWith('.json')) {
        const count = await importDecksFromJSON(file);
        setIsImporting(false);
        showNotification(`Successfully imported ${count} deck(s)!`, 'success');
        loadDecks();
      } else if (file.name.endsWith('.txt')) {
        const deck = await importDeckFromTXT(file, getCardByName);
        setIsImporting(false);
        showNotification(`Successfully imported deck "${deck.name}"!`, 'success');
        loadDecks();
        setTimeout(() => {
          navigate(`/deck/${deck.id}`);
        }, 500);
      } else {
        setIsImporting(false);
        showNotification('Please select a .json or .txt file', 'error');
      }
    } catch (error) {
      setIsImporting(false);
      showNotification('Error importing: ' + error.message, 'error');
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasteImport = async (e) => {
    e.preventDefault();
    if (!importPasteText.trim()) {
      showNotification('Please paste a deck list', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const deck = await importDeckFromTXTContent(importPasteText.trim(), 'Imported Deck', getCardByName);
      setIsImporting(false);
      showNotification(`Successfully imported deck "${deck.name}"!`, 'success');
      loadDecks();
      setImportPasteText('');
      setShowImportOptions(false);
      setTimeout(() => {
        navigate(`/deck/${deck.id}`);
      }, 500);
    } catch (error) {
      setIsImporting(false);
      showNotification('Error importing from paste: ' + error.message, 'error');
    }
  };

  return (
    <main className="decks-page">
      <div className="container">
        <div className="decks-header">
          <h1>My Decks</h1>
          <div className="decks-actions">
            <button
              onClick={handleExportAll}
              className="export-button"
              title="Export all decks to JSON"
            >
              📥 Export All
            </button>
            <button
              onClick={handleImportClick}
              className="import-button"
              title="Import decks from file or URL"
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : '📤 Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="create-deck-button"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Deck'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateDeck} className="create-deck-form">
            <input
              type="text"
              placeholder="Enter deck name"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="deck-name-input"
              autoFocus
            />
            <button type="submit" className="submit-deck-button">
              Create Deck
            </button>
          </form>
        )}

        {isImporting && (
          <div className="import-loading-notification">
            <div className="import-spinner-small"></div>
            <span>Importing deck...</span>
          </div>
        )}

        {importMessage && (
          <div className={`import-notification ${importMessage.type}`}>
            {importMessage.type === 'success' ? '✓' : '✗'} {importMessage.message}
          </div>
        )}

        {showImportOptions && (
          <div className="import-options">
            <div className="import-options-header">
              <h3>Import Deck</h3>
              <button
                onClick={() => {
                  setShowImportOptions(false);
                  setImportPasteText('');
                }}
                className="close-import-button"
                title="Close"
                disabled={isImporting}
              >
                ×
              </button>
            </div>
            <div className="import-options-content">
              <div className="import-option">
                <h4>Import from File</h4>
                <p>Select a .txt or .json file from your computer</p>
                <button
                  onClick={handleFileImportClick}
                  className="import-file-button"
                  disabled={isImporting}
                >
                  Choose File
                </button>
              </div>
              <div className="import-divider">OR</div>
              <div className="import-option">
                <h4>Paste Deck List</h4>
                <p>Copy and paste your deck list from Moxfield or other sources</p>
                <form onSubmit={handlePasteImport} className="import-paste-form">
                  <textarea
                    placeholder="Paste your deck list here...&#10;&#10;Example:&#10;// COMMANDER&#10;1 Commander Name&#10;&#10;1 Card Name&#10;2 Another Card"
                    value={importPasteText}
                    onChange={(e) => setImportPasteText(e.target.value)}
                    className="import-paste-textarea"
                    disabled={isImporting}
                    rows={8}
                  />
                  <button
                    type="submit"
                    className="import-paste-button"
                    disabled={isImporting || !importPasteText.trim()}
                  >
                    Import
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <DeckList decks={decks} onDeleteDeck={handleDeleteDeck} />
      </div>
    </main>
  );
}

