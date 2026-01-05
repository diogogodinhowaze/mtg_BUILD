// Custom card storage service using localStorage
// This stores custom cards that can be created, edited, and deleted by admins

const STORAGE_KEY = 'mtg_custom_cards';
const DELETED_CARDS_KEY = 'mtg_deleted_cards'; // Track deleted MTGJSON cards

// Get all custom cards
export const getAllCustomCards = () => {
  try {
    const cards = localStorage.getItem(STORAGE_KEY);
    return cards ? JSON.parse(cards) : [];
  } catch (error) {
    console.error('Error loading custom cards:', error);
    return [];
  }
};

// Get custom card by ID
export const getCustomCardById = (id) => {
  const cards = getAllCustomCards();
  return cards.find(card => card.id === id) || null;
};

// Save custom card
export const saveCustomCard = (card) => {
  try {
    const cards = getAllCustomCards();
    const existingIndex = cards.findIndex(c => c.id === card.id);
    
    if (existingIndex >= 0) {
      cards[existingIndex] = {
        ...card,
        updatedAt: new Date().toISOString()
      };
    } else {
      cards.push({
        ...card,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    
    // Trigger index rebuild
    if (typeof window !== 'undefined' && window.rebuildCardIndexes) {
      window.rebuildCardIndexes();
    }
    
    return true;
  } catch (error) {
    console.error('Error saving custom card:', error);
    return false;
  }
};

// Delete custom card
export const deleteCustomCard = (id) => {
  try {
    const cards = getAllCustomCards();
    const filteredCards = cards.filter(card => card.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCards));
    
    // Trigger index rebuild
    if (typeof window !== 'undefined' && window.rebuildCardIndexes) {
      window.rebuildCardIndexes();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting custom card:', error);
    return false;
  }
};

// Create new custom card
export const createCustomCard = (cardData) => {
  const newCard = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: cardData.name || 'Unnamed Card',
    mana_cost: cardData.mana_cost || '',
    cmc: cardData.cmc || 0,
    type_line: cardData.type_line || '',
    oracle_text: cardData.oracle_text || '',
    power: cardData.power || null,
    toughness: cardData.toughness || null,
    loyalty: cardData.loyalty || null,
    rarity: cardData.rarity || 'common',
    set_name: cardData.set_name || 'Custom',
    set: cardData.set || 'CUSTOM',
    collector_number: cardData.collector_number || '',
    released_at: cardData.released_at || new Date().toISOString(),
    image_uris: cardData.image_uris || {},
    color_identity: cardData.color_identity || [],
    colors: cardData.colors || [],
    keywords: cardData.keywords || [],
    prices: {},
    isCustom: true // Flag to identify custom cards
  };
  
  saveCustomCard(newCard);
  return newCard;
};

// Get deleted cards list (for hiding MTGJSON cards)
export const getDeletedCards = () => {
  try {
    const deleted = localStorage.getItem(DELETED_CARDS_KEY);
    return deleted ? JSON.parse(deleted) : [];
  } catch (error) {
    console.error('Error loading deleted cards:', error);
    return [];
  }
};

// Mark a card as deleted (hide from searches)
export const deleteCard = (cardId) => {
  try {
    const deleted = getDeletedCards();
    if (!deleted.includes(cardId)) {
      deleted.push(cardId);
      localStorage.setItem(DELETED_CARDS_KEY, JSON.stringify(deleted));
      
      // Trigger index rebuild
      if (typeof window !== 'undefined' && window.rebuildCardIndexes) {
        window.rebuildCardIndexes();
      }
    }
    return true;
  } catch (error) {
    console.error('Error deleting card:', error);
    return false;
  }
};

// Restore a deleted card
export const restoreCard = (cardId) => {
  try {
    const deleted = getDeletedCards();
    const filtered = deleted.filter(id => id !== cardId);
    localStorage.setItem(DELETED_CARDS_KEY, JSON.stringify(filtered));
    
    // Trigger index rebuild
    if (typeof window !== 'undefined' && window.rebuildCardIndexes) {
      window.rebuildCardIndexes();
    }
    
    return true;
  } catch (error) {
    console.error('Error restoring card:', error);
    return false;
  }
};

// Check if a card is deleted
export const isCardDeleted = (cardId) => {
  const deleted = getDeletedCards();
  return deleted.includes(cardId);
};

// Export all custom cards to JSON
export const exportCustomCardsToJSON = () => {
  const cards = getAllCustomCards();
  const dataStr = JSON.stringify(cards, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'custom_cards.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import custom cards from JSON
export const importCustomCardsFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCards = JSON.parse(e.target.result);
        if (!Array.isArray(importedCards)) {
          reject(new Error('Invalid format: Expected an array of cards'));
          return;
        }

        const existingCards = getAllCustomCards();
        const existingIds = new Set(existingCards.map(c => c.id));
        let importedCount = 0;
        
        importedCards.forEach(card => {
          if (!existingIds.has(card.id)) {
            if (card.name) {
              existingCards.push({
                ...card,
                isCustom: true
              });
              importedCount++;
            }
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingCards));
        resolve(importedCount);
      } catch (error) {
        reject(new Error('Failed to parse JSON file: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export default {
  getAllCustomCards,
  getCustomCardById,
  saveCustomCard,
  deleteCustomCard,
  createCustomCard,
  getDeletedCards,
  deleteCard,
  restoreCard,
  isCardDeleted,
  exportCustomCardsToJSON,
  importCustomCardsFromJSON
};

