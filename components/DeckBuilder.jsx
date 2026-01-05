import React, { useState, useEffect } from 'react';
import { getDeckStats } from '../services/deckStorage';
import Card from './Card';
import ManaCost from './ManaCost';
import { getCardImage, getCardManaCost } from '../utils/cardUtils';

export default function DeckBuilder({ deck, onUpdateDeck, onRemoveCard }) {
  const [activeTab, setActiveTab] = useState('mainboard');
  const [stats, setStats] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (deck) {
      const deckStats = getDeckStats(deck);
      setStats(deckStats);
    }
  }, [deck]);

  if (!deck) {
    return <div className="no-deck">No deck selected</div>;
  }

  const currentBoard = activeTab === 'mainboard' ? deck.mainboard : deck.sideboard;
  const boardName = activeTab === 'mainboard' ? 'Mainboard' : 'Sideboard';

  const handleQuantityChange = (cardId, change) => {
    const board = activeTab === 'mainboard' ? 'mainboard' : 'sideboard';
    const updatedBoard = currentBoard.map(card => {
      if (card.cardData.id === cardId) {
        const newQuantity = Math.max(0, Math.min(4, card.quantity + change));
        if (newQuantity === 0) {
          return null;
        }
        return { ...card, quantity: newQuantity };
      }
      return card;
    }).filter(Boolean);

    const updatedDeck = {
      ...deck,
      [board]: updatedBoard,
      updatedAt: new Date().toISOString()
    };

    onUpdateDeck(updatedDeck);
  };

  const handleRemoveCard = (cardId) => {
    if (onRemoveCard) {
      onRemoveCard(cardId, activeTab);
    }
  };

  // Group cards by name first
  const groupedCards = currentBoard.reduce((acc, card) => {
    const key = card.cardData.name;
    if (!acc[key]) {
      acc[key] = card;
    } else {
      acc[key].quantity += card.quantity;
    }
    return acc;
  }, {});

  const cardList = Object.values(groupedCards);

  // Categorize cards by type
  const categorizeCard = (card) => {
    const typeLine = card.cardData.type_line || '';
    const lowerType = typeLine.toLowerCase();
    
    if (lowerType.includes('planeswalker')) return 'Planeswalkers';
    if (lowerType.includes('creature')) return 'Creatures';
    if (lowerType.includes('instant')) return 'Instants';
    if (lowerType.includes('sorcery')) return 'Sorceries';
    if (lowerType.includes('artifact')) return 'Artifacts';
    if (lowerType.includes('enchantment')) return 'Enchantments';
    if (lowerType.includes('land')) return 'Lands';
    return 'Other';
  };

  // Group cards by category
  const cardsByCategory = cardList.reduce((acc, card) => {
    const category = categorizeCard(card);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(card);
    return acc;
  }, {});

  // Order of categories
  const categoryOrder = ['Planeswalkers', 'Creatures', 'Instants', 'Sorceries', 'Artifacts', 'Enchantments', 'Lands', 'Other'];
  const sortedCategories = categoryOrder.filter(cat => cardsByCategory[cat] && cardsByCategory[cat].length > 0);

  return (
    <div className="deck-builder">
      <div className="deck-header">
        <h2>{deck.name}</h2>
        {stats && (
          <div className="deck-stats">
            <div className="stat-item">
              <span className="stat-label">Mainboard:</span>
              <span className={`stat-value ${stats.mainboardCount < 60 ? 'invalid' : ''}`}>
                {stats.mainboardCount}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sideboard:</span>
              <span className={`stat-value ${stats.sideboardCount > 15 ? 'invalid' : ''}`}>
                {stats.sideboardCount}
              </span>
            </div>
            {stats.isLegal && (
              <span className="legal-badge">✓ Legal</span>
            )}
          </div>
        )}
      </div>

      <div className="deck-tabs">
        <button
          className={`deck-tab ${activeTab === 'mainboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('mainboard')}
        >
          Mainboard ({stats ? stats.mainboardCount : deck.mainboard?.reduce((sum, card) => sum + card.quantity, 0) || 0})
        </button>
        <button
          className={`deck-tab ${activeTab === 'sideboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('sideboard')}
        >
          Sideboard ({stats ? stats.sideboardCount : deck.sideboard?.reduce((sum, card) => sum + card.quantity, 0) || 0})
        </button>
      </div>

      <div className="deck-board">
        {cardList.length === 0 ? (
          <div className="empty-board">
            <p>Your {boardName.toLowerCase()} is empty.</p>
            <p>Search for cards and add them to your deck!</p>
          </div>
        ) : (
          <div className="deck-list-grouped">
            {sortedCategories.map((category) => (
              <div key={category} className="deck-category-section">
                <h4 className="deck-category-header">
                  {category} ({cardsByCategory[category].reduce((sum, c) => sum + c.quantity, 0)})
                </h4>
                <div className="deck-list">
                  {cardsByCategory[category].map((card) => {
                    const imageUrl = getCardImage(card.cardData);
                    return (
                      <div 
                        key={card.cardData.id} 
                        className="deck-card-item"
                        onMouseEnter={(e) => {
                          if (imageUrl) {
                            const cardWidth = 223 * 1.4;
                            const cardHeight = 311 * 1.4;
                            // Position relative to mouse cursor
                            let x = e.clientX + 20;
                            let y = e.clientY + 20;
                            
                            // Adjust if card would go off screen
                            if (x + cardWidth > window.innerWidth) {
                              x = e.clientX - cardWidth - 20;
                            }
                            if (y + cardHeight > window.innerHeight) {
                              y = window.innerHeight - cardHeight - 10;
                            }
                            if (x < 0) x = 10;
                            if (y < 0) y = 10;
                            
                            setHoveredCard(card.cardData);
                            setHoverPosition({ x, y });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredCard(null);
                        }}
                        onMouseMove={(e) => {
                          if (imageUrl && hoveredCard) {
                            const cardWidth = 223 * 1.4;
                            const cardHeight = 311 * 1.4;
                            // Position relative to mouse cursor
                            let x = e.clientX + 20;
                            let y = e.clientY + 20;
                            
                            // Adjust if card would go off screen
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
                        <div className="deck-card-quantity">
                          <button
                            onClick={() => handleQuantityChange(card.cardData.id, -1)}
                            className="quantity-button"
                          >
                            -
                          </button>
                          <span className="quantity-value">{card.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(card.cardData.id, 1)}
                            className="quantity-button"
                            disabled={card.quantity >= 4}
                          >
                            +
                          </button>
                        </div>
                        <div className="deck-card-info">
                          <div className="deck-card-name-row">
                            <span className="deck-card-name">{card.cardData.name}</span>
                          </div>
                          {getCardManaCost(card.cardData) && (
                            <ManaCost manaCost={getCardManaCost(card.cardData)} className="deck-card-mana" />
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCard(card.cardData.id)}
                          className="remove-card-button"
                          title="Remove from deck"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {hoveredCard && (
          <div 
            className="hover-card-preview mainboard-preview"
            style={{
              left: `${hoverPosition.x}px`,
              top: `${hoverPosition.y}px`
            }}
          >
            <img 
              src={getCardImage(hoveredCard)} 
              alt={hoveredCard.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}

