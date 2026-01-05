import React, { useState } from 'react';
import CardSearch from '../components/CardSearch';
import { saveDeck, getDeckById } from '../services/deckStorage';
import { useParams, useNavigate } from 'react-router-dom';

export default function Search() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [currentDeck, setCurrentDeck] = useState(null);

  React.useEffect(() => {
    if (deckId) {
      const deck = getDeckById(deckId);
      setCurrentDeck(deck);
    }
  }, [deckId]);

  const handleAddToDeck = (card) => {
    if (!deckId) {
      alert('Please create or select a deck first!');
      return;
    }

    const deck = getDeckById(deckId);
    if (!deck) {
      alert('Deck not found!');
      return;
    }

    // Check if card already exists in mainboard
    const existingCardIndex = deck.mainboard.findIndex(
      c => c.cardData.id === card.id
    );

    let updatedMainboard;
    if (existingCardIndex >= 0) {
      // Increase quantity if less than 4
      const existingCard = deck.mainboard[existingCardIndex];
      if (existingCard.quantity < 4) {
        updatedMainboard = [...deck.mainboard];
        updatedMainboard[existingCardIndex] = {
          ...existingCard,
          quantity: existingCard.quantity + 1
        };
      } else {
        alert('Maximum 4 copies of a card allowed in mainboard!');
        return;
      }
    } else {
      // Add new card
      updatedMainboard = [
        ...deck.mainboard,
        {
          cardData: card,
          quantity: 1
        }
      ];
    }

    const updatedDeck = {
      ...deck,
      mainboard: updatedMainboard,
      updatedAt: new Date().toISOString()
    };

    saveDeck(updatedDeck);
    setCurrentDeck(updatedDeck);
  };

  return (
    <main className="search-page">
      <div className="container">
        <h1>Search Cards</h1>
        {currentDeck && (
          <div className="current-deck-banner">
            Adding to: <strong>{currentDeck.name}</strong>
            <button onClick={() => navigate(`/deck/${deckId}`)}>
              View Deck
            </button>
          </div>
        )}
        {!deckId && (
          <div className="no-deck-warning">
            <p>⚠️ Create or select a deck to add cards to it.</p>
            <button onClick={() => navigate('/decks')}>
              Go to My Decks
            </button>
          </div>
        )}
        <CardSearch onAddToDeck={deckId ? handleAddToDeck : null} />
      </div>
    </main>
  );
}

