import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Search from './pages/Search';
import Decks from './pages/Decks';
import DeckBuilderPage from './pages/DeckBuilderPage';
import Login from './pages/Login';
import Admin from './pages/Admin';
import './App.css';
// In App.js or index.js
import { loadMTGJSONData } from './services/mtgjsonApi';

// Load in background when app starts
loadMTGJSONData().catch(err => {
  console.warn('Failed to preload MTGJSON:', err);
});
function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search/:deckId" element={<Search />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/deck/:deckId" element={<DeckBuilderPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
