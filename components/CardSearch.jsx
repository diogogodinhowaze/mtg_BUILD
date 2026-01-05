import React, { useState, useEffect, useRef } from 'react';
import { searchCards, autocompleteCardName, loadMTGJSONData } from '../services/mtgjsonApi';
import Card from './Card';

export default function CardSearch({ onAddToDeck, onSetCommander = null, hasCommander = false }) {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const suggestionsTimeoutRef = useRef(null);

  // Load MTGJSON data on component mount
  useEffect(() => {
    loadMTGJSONData()
      .catch(err => {
        console.error('Failed to load MTGJSON data:', err);
        setError('Failed to load card database. Please ensure AllPrintings.json is in public/data/');
      })
      .finally(() => setDbLoading(false));
  }, []);

  useEffect(() => {
    // Only show suggestions if we're actively typing (not after a search)
    if (query.trim().length >= 2 && !isSearching) {
      // Debounce autocomplete
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
      
      suggestionsTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await autocompleteCardName(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (err) {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, [query, isSearching]);

  const handleSearch = async (searchQuery = query, pageNum = 1) => {
    if (!searchQuery.trim()) {
      setCards([]);
      setError('');
      setIsSearching(false);
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);
    setIsSearching(true);

    try {
      const result = await searchCards(searchQuery, pageNum);
      if (pageNum === 1) {
        setCards(result.cards);
      } else {
        setCards(prev => [...prev, ...result.cards]);
      }
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError('No cards found. Try a different search term.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query, 1);
  };

  const handleLoadMore = () => {
    handleSearch(query, page + 1);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setIsSearching(true);
    handleSearch(suggestion, 1);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    // Reset search state when user starts typing again
    if (isSearching) {
      setIsSearching(false);
    }
  };

  const handleInputFocus = () => {
    // Only show suggestions if query is long enough and we haven't searched yet
    if (query.length >= 2 && !isSearching) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Hide suggestions when clicking away, but delay to allow suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  if (dbLoading) {
    return (
      <div className="db-loading-overlay">
        <div className="db-loading-content">
          <div className="loading-spinner-large"></div>
          <h3>Loading Card Database</h3>
          <p>This only happens once when you first visit the site</p>
          <p>Processing ~60,000 Magic cards...</p>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for MTG cards (e.g., 'lightning bolt', 'type:creature', 'cmc:3')"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading && cards.length === 0 && (
        <div className="loading">Loading cards...</div>
      )}

      {cards.length > 0 && (
        <>
          <div className="cards-grid">
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onAddToDeck={onAddToDeck}
                showAddButton={!!onAddToDeck}
                onSetCommander={onSetCommander}
                hasCommander={hasCommander}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="load-more-container">
              <button onClick={handleLoadMore} className="load-more-button" disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && cards.length === 0 && query && !error && (
        <div className="no-results">
          <p>Start typing to search for cards...</p>
        </div>
      )}
    </div>
  );
}

