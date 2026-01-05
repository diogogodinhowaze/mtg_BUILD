import React from 'react';
import { Link } from 'react-router-dom';
import { getDeckStats, exportDeckToTXT, getDeckColors } from '../services/deckStorage';
import ColorIdentity from './ColorIdentity';

export default function DeckList({ decks, onDeleteDeck }) {
  if (!decks || decks.length === 0) {
    return (
      <div className="no-decks">
        <p>You don't have any decks yet.</p>
        <p>Create your first deck to get started!</p>
      </div>
    );
  }

  return (
    <div className="deck-list">
      {decks.map((deck) => {
        const stats = getDeckStats(deck);
        const deckColors = getDeckColors(deck);
        return (
          <div key={deck.id} className="deck-card">
            <Link to={`/deck/${deck.id}`} className="deck-card-link">
              <div className="deck-card-title-row">
                <h3>{deck.name}</h3>
                {deck.isCommander && <span className="commander-badge">Commander</span>}
              </div>
              <div className="deck-card-stats">
                <span>{stats.mainboardCount} mainboard</span>
                <span>{stats.sideboardCount} sideboard</span>
                {stats.isLegal && <span className="legal-indicator">✓ Legal</span>}
              </div>
              {deckColors.length > 0 && (
                <div className="deck-card-colors">
                  <ColorIdentity colorIdentity={deckColors} size="small" />
                </div>
              )}
              <div className="deck-card-meta">
                <span>Updated: {new Date(deck.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
            <div className="deck-card-actions">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  exportDeckToTXT(deck.id);
                }}
                className="export-deck-button"
                title="Export deck to TXT file"
              >
                📥 Export
              </button>
              {onDeleteDeck && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm(`Delete "${deck.name}"?`)) {
                      onDeleteDeck(deck.id);
                    }
                  }}
                  className="delete-deck-button"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

