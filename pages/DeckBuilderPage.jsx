import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DeckBuilder from '../components/DeckBuilder';
import CardSearch from '../components/CardSearch';
import ManaCost from '../components/ManaCost';
import { getDeckById, saveDeck, deleteDeck } from '../services/deckStorage';
import { getCardImage, getCardManaCost } from '../utils/cardUtils';

export default function DeckBuilderPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [deckName, setDeckName] = useState('');
  const [addConfirmation, setAddConfirmation] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredCommander, setHoveredCommander] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (deckId) {
      const loadedDeck = getDeckById(deckId);
      if (loadedDeck) {
        setDeck(loadedDeck);
        setDeckName(loadedDeck.name);
      } else {
        navigate('/decks');
      }
    }
  }, [deckId, navigate]);

  const handleUpdateDeck = (updatedDeck) => {
    saveDeck(updatedDeck);
    setDeck(updatedDeck);
  };

  const handleNameChange = (newName) => {
    setDeckName(newName);
    if (deck) {
      const updatedDeck = {
        ...deck,
        name: newName,
        updatedAt: new Date().toISOString()
      };
      handleUpdateDeck(updatedDeck);
    }
  };

  const handleCommanderToggle = (isCommander) => {
    if (!deck) return;
    
    const updatedDeck = {
      ...deck,
      isCommander: isCommander,
      commander: isCommander ? (deck.commander || null) : null,
      updatedAt: new Date().toISOString()
    };
    handleUpdateDeck(updatedDeck);
  };

  const handleSetCommander = (card) => {
    if (!deck) return;
    
    const updatedDeck = {
      ...deck,
      commander: card ? {
        cardData: card
      } : null,
      updatedAt: new Date().toISOString()
    };
    handleUpdateDeck(updatedDeck);
    
    if (card) {
      setAddConfirmation(`${card.name} set as commander`);
      setTimeout(() => {
        setAddConfirmation(null);
      }, 2000);
    }
  };

  

  const handleAddToDeck = (card) => {
    if (!deck) return;

    const existingCardIndex = deck.mainboard.findIndex(
      c => c.cardData.id === card.id
    );

    let updatedMainboard;
    let confirmationMessage = '';
    
    if (existingCardIndex >= 0) {
      const existingCard = deck.mainboard[existingCardIndex];
      if (existingCard.quantity < 4) {
        updatedMainboard = [...deck.mainboard];
        updatedMainboard[existingCardIndex] = {
          ...existingCard,
          quantity: existingCard.quantity + 1
        };
        confirmationMessage = `${card.name} (${existingCard.quantity + 1}x)`;
      } else {
        alert('Maximum 4 copies allowed!');
        return;
      }
    } else {
      updatedMainboard = [
        ...deck.mainboard,
        {
          cardData: card,
          quantity: 1
        }
      ];
      confirmationMessage = `${card.name} added`;
    }

    handleUpdateDeck({
      ...deck,
      mainboard: updatedMainboard,
      updatedAt: new Date().toISOString()
    });

    // Show confirmation
    setAddConfirmation(confirmationMessage);
    setTimeout(() => {
      setAddConfirmation(null);
    }, 2000);
  };

  const handleRemoveCard = (cardId, board) => {
    if (!deck) return;

    const boardKey = board === 'mainboard' ? 'mainboard' : 'sideboard';
    const updatedBoard = deck[boardKey].filter(
      c => c.cardData.id !== cardId
    );

    handleUpdateDeck({
      ...deck,
      [boardKey]: updatedBoard,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteDeck = () => {
    if (window.confirm(`Delete "${deck.name}"?`)) {
      deleteDeck(deckId);
      navigate('/decks');
    }
  };

  if (!deck) {
    return <div className="loading">Loading deck...</div>;
  }

  return (
    <main className="deck-builder-page">
      <div className="container">
        <div className="deck-builder-header">
          <div className="deck-name-section">
            <input
              type="text"
              className="deck-name-input"
              value={deckName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Deck Name"
            />
            <label className="commander-checkbox-label">
              <input
                type="checkbox"
                checked={deck.isCommander || false}
                onChange={(e) => handleCommanderToggle(e.target.checked)}
                className="commander-checkbox"
              />
              <span>Commander Deck</span>
            </label>
          </div>
          <div className="deck-actions">
            <button
              onClick={handleDeleteDeck}
              className="delete-deck-button"
            >
              Delete Deck
            </button>
            <button onClick={() => navigate('/decks')} className="back-button">
              Back to Decks
            </button>
          </div>
        </div>

        <div className="deck-builder-header-actions">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="toggle-search-button"
          >
            {showSearch ? 'Hide Search' : 'Show Search'}
          </button>
        </div>

        {showSearch && (
          <div className="deck-search-section">
            <div className="deck-search-header">
              <h3>Search Cards</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="close-search-button"
                title="Close search"
              >
                ×
              </button>
            </div>
            <CardSearch 
              onAddToDeck={handleAddToDeck}
              onSetCommander={deck.isCommander ? handleSetCommander : null}
              hasCommander={deck.isCommander && !!deck.commander && (!Array.isArray(deck.commander) || deck.commander.length >= 2)}
            />
          </div>
        )}

        {addConfirmation && (
          <div className="add-confirmation">
            ✓ {addConfirmation}
          </div>
        )}

        {deck.isCommander && (
          <div className="commander-section">
            <h3>{Array.isArray(deck.commander) ? 'Commanders' : 'Commander'}</h3>
            {deck.commander ? (
              Array.isArray(deck.commander) ? (
                // Partner commanders
                <div className="partner-commanders">
                  {deck.commander.map((cmd, index) => (
                    <div 
                      key={index}
                      className="commander-display"
                      onMouseEnter={(e) => {
                        const imageUrl = getCardImage(cmd.cardData);
                        if (imageUrl) {
                          const cardWidth = 223 * 1.5;
                          const cardHeight = 311 * 1.5;
                          let x = e.clientX + 20;
                          let y = e.clientY + 20;
                          
                          if (x + cardWidth > window.innerWidth) {
                            x = e.clientX - cardWidth - 20;
                          }
                          if (y + cardHeight > window.innerHeight) {
                            y = window.innerHeight - cardHeight - 10;
                          }
                          if (x < 0) x = 10;
                          if (y < 0) y = 10;
                          
                          setHoveredCommander(cmd.cardData);
                          setHoverPosition({ x, y });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCommander(null);
                      }}
                      onMouseMove={(e) => {
                        if (hoveredCommander) {
                          const cardWidth = 223 * 1.5;
                          const cardHeight = 311 * 1.5;
                          let x = e.clientX + 20;
                          let y = e.clientY + 20;
                          
                          if (x + cardWidth > window.innerWidth) {
                            x = e.clientX - cardWidth - 20;
                          }
                          if (y + cardHeight > window.innerHeight) {
                            y = window.innerHeight - cardHeight - 10;
                          }
                          if (x < 0) x = 10;
                          if (y < 0) y = 10;
                          
                          setHoverPosition({ x, y });
                        }
                      }}
                    >
                      <div className="commander-name-row">
                        <span>{cmd.cardData.name}</span>
                        {getCardManaCost(cmd.cardData) && (
                          <ManaCost manaCost={getCardManaCost(cmd.cardData)} className="commander-mana-cost" />
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => handleSetCommander(null)}
                    className="remove-commander-button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                // Single commander
                <div 
                  className="commander-display"
                  onMouseEnter={(e) => {
                    const imageUrl = getCardImage(deck.commander.cardData);
                    if (imageUrl) {
                      const cardWidth = 223 * 1.5;
                      const cardHeight = 311 * 1.5;
                      let x = e.clientX + 20;
                      let y = e.clientY + 20;
                      
                      if (x + cardWidth > window.innerWidth) {
                        x = e.clientX - cardWidth - 20;
                      }
                      if (y + cardHeight > window.innerHeight) {
                        y = window.innerHeight - cardHeight - 10;
                      }
                      if (x < 0) x = 10;
                      if (y < 0) y = 10;
                      
                      setHoveredCommander(deck.commander.cardData);
                      setHoverPosition({ x, y });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredCommander(null);
                  }}
                  onMouseMove={(e) => {
                    if (hoveredCommander) {
                      const cardWidth = 223 * 1.5;
                      const cardHeight = 311 * 1.5;
                      let x = e.clientX + 20;
                      let y = e.clientY + 20;
                      
                      if (x + cardWidth > window.innerWidth) {
                        x = e.clientX - cardWidth - 20;
                      }
                      if (y + cardHeight > window.innerHeight) {
                        y = window.innerHeight - cardHeight - 10;
                      }
                      if (x < 0) x = 10;
                      if (y < 0) y = 10;
                      
                      setHoverPosition({ x, y });
                    }
                  }}
                >
                  <div className="commander-name-row">
                    <span>{deck.commander.cardData.name}</span>
                    {getCardManaCost(deck.commander.cardData) && (
                      <ManaCost manaCost={getCardManaCost(deck.commander.cardData)} className="commander-mana-cost" />
                    )}
                  </div>
                  <button
                    onClick={() => handleSetCommander(null)}
                    className="remove-commander-button"
                  >
                    Remove
                  </button>
                </div>
              )
            ) : (
              <p className="commander-placeholder">Search for a card and click the ⭐ button to set as commander</p>
            )}
          </div>
        )}

        {hoveredCommander && (
          <div 
            className="hover-card-preview commander-preview"
            style={{
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y}px`
            }}
          >
            <img 
              src={getCardImage(hoveredCommander)} 
              alt={hoveredCommander.name}
            />
          </div>
        )}

        <DeckBuilder
          deck={deck}
          onUpdateDeck={handleUpdateDeck}
          onRemoveCard={handleRemoveCard}
        />
      </div>
    </main>
  );
}

