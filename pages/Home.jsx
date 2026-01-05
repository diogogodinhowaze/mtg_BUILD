import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>MTG Deck Builder</h1>
          <p>Search for Magic: The Gathering cards and build your perfect deck</p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary">
              Search Cards
            </Link>
            <Link to="/decks" className="btn btn-secondary">
              My Decks
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🔍 Card Search</h3>
              <p>Search through thousands of MTG cards using local MTGJSON data</p>
            </div>
            <div className="feature-card">
              <h3>📚 Deck Building</h3>
              <p>Create and manage multiple decks with an intuitive deck builder interface</p>
            </div>
            <div className="feature-card">
              <h3>📊 Deck Statistics</h3>
              <p>Track your deck's legality, card counts, and color distribution</p>
            </div>
            <div className="feature-card">
              <h3>💾 Save Locally</h3>
              <p>All your decks are saved locally in your browser - no account needed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="container">
          <h2>Getting Started</h2>
          <ol className="getting-started-list">
            <li>Create a new deck from the "My Decks" page</li>
            <li>Search for cards using the search page</li>
            <li>Add cards to your deck (up to 4 copies per card)</li>
            <li>Build a legal deck with 60+ cards in mainboard and up to 15 in sideboard</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
