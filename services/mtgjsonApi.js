// MTGJSON API service - loads and searches MTG card data from MTGJSON
// MTGJSON data should be placed in public/data/AllPrintings.json

import { getAllCustomCards, isCardDeleted } from './cardStorage';

let mtgjsonData = null;
let cardsIndex = null; // Flat array of all cards for faster searching
let cardsByNameIndex = null; // Index by card name for quick lookups

/**
 * Load MTGJSON data from the public folder
 * This should be called once when the app starts
 */
// Cache the loading promise to prevent duplicate loads
let loadPromise = null;

export const loadMTGJSONData = async () => {
  if (mtgjsonData) {
    return mtgjsonData;
  }
  
  // If already loading, return the same promise
  if (loadPromise) {
    return loadPromise;
  }
  
  loadPromise = (async () => {
    try {
      console.time('MTGJSON Load Time');
      const response = await fetch('/data/AllPrintings.json');
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }
      
      const data = await response.json();
      mtgjsonData = data;
      
      // Build indexes in a non-blocking way
      setTimeout(() => {
        buildIndexes(data);
        console.timeEnd('MTGJSON Load Time');
        console.log(`Loaded ${cardsIndex?.length || 0} cards`);
      }, 0);
      
      // Rebuild indexes when custom cards change (for immediate updates)
      if (typeof window !== 'undefined') {
        window.rebuildCardIndexes = () => {
          if (mtgjsonData) {
            buildIndexes(mtgjsonData);
          }
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error loading MTGJSON:', error);
      loadPromise = null; // Reset on error
      throw error;
    }
  })();
  
  return loadPromise;
};

/**
 * Build search indexes from MTGJSON data
 */
const buildIndexes = (data) => {
  cardsIndex = [];
  cardsByNameIndex = new Map();
  
  // MTGJSON structure: { data: { "SET_CODE": { cards: [...] } } }
  if (data && data.data) {
    Object.values(data.data).forEach(set => {
      if (set.cards && Array.isArray(set.cards)) {
        set.cards.forEach(card => {
          // Convert MTGJSON card to Scryfall-like format
          const convertedCard = convertMTGJSONToScryfall(card, set);
          
          // Skip deleted cards
          if (!isCardDeleted(convertedCard.id)) {
            cardsIndex.push(convertedCard);
            
            // Index by name (case-insensitive)
            const nameKey = card.name?.toLowerCase();
            if (nameKey) {
              if (!cardsByNameIndex.has(nameKey)) {
                cardsByNameIndex.set(nameKey, []);
              }
              cardsByNameIndex.get(nameKey).push(convertedCard);
            }
          }
        });
      }
    });
  }
  
  // Add custom cards
  const customCards = getAllCustomCards();
  customCards.forEach(card => {
    // Custom cards override MTGJSON cards with same ID
    const existingIndex = cardsIndex.findIndex(c => c.id === card.id);
    if (existingIndex >= 0) {
      cardsIndex[existingIndex] = card;
    } else {
      cardsIndex.push(card);
    }
    
    // Index by name
    const nameKey = card.name?.toLowerCase();
    if (nameKey) {
      if (!cardsByNameIndex.has(nameKey)) {
        cardsByNameIndex.set(nameKey, []);
      }
      // Remove old entries with same ID and add new one
      const nameIndex = cardsByNameIndex.get(nameKey);
      const filtered = nameIndex.filter(c => c.id !== card.id);
      filtered.push(card);
      cardsByNameIndex.set(nameKey, filtered);
    }
  });
  
  console.log(`Indexed ${cardsIndex.length} cards (${customCards.length} custom)`);
};

/**
 * Get Scryfall image URLs for a card using various identifiers
 */
const getCardImageUrls = (card) => {
  const identifiers = card.identifiers || {};
  
  // Priority 1: Scryfall ID (most reliable)
  if (identifiers.scryfallId) {
    const scryfallId = identifiers.scryfallId;
    return {
      normal: `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`,
      large: `https://cards.scryfall.io/large/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`,
      small: `https://cards.scryfall.io/small/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`,
      png: `https://cards.scryfall.io/png/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.png`,
      art_crop: `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`,
      border_crop: `https://cards.scryfall.io/border_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
    };
  }
  
  // Priority 2: Scryfall Oracle ID (for card faces)
  if (identifiers.scryfallOracleId) {
    const oracleId = identifiers.scryfallOracleId;
    return {
      normal: `https://cards.scryfall.io/normal/front/${oracleId[0]}/${oracleId[1]}/${oracleId}.jpg`,
      large: `https://cards.scryfall.io/large/front/${oracleId[0]}/${oracleId[1]}/${oracleId}.jpg`,
      small: `https://cards.scryfall.io/small/front/${oracleId[0]}/${oracleId[1]}/${oracleId}.jpg`
    };
  }
  
  // Priority 3: Multiverse ID (Gatherer)
  if (identifiers.multiverseId) {
    return {
      normal: `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${identifiers.multiverseId}&type=card`,
      large: `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${identifiers.multiverseId}&type=card`,
      small: `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${identifiers.multiverseId}&type=card`
    };
  }
  
  // Priority 4: MTGO ID
  if (identifiers.mtgoId) {
    return {
      normal: `https://card-images.mtgo.com/multiverse/${identifiers.mtgoId}.jpg`,
      large: `https://card-images.mtgo.com/multiverse/${identifiers.mtgoId}.jpg`,
      small: `https://card-images.mtgo.com/multiverse/${identifiers.mtgoId}.jpg`
    };
  }
  
  // Priority 5: Cardmarket ID
  if (identifiers.cardmarketId) {
    return {
      normal: `https://cardmarket.com/images/cards/${identifiers.cardmarketId}.jpg`,
      large: `https://cardmarket.com/images/cards/${identifiers.cardmarketId}.jpg`,
      small: `https://cardmarket.com/images/cards/${identifiers.cardmarketId}.jpg`
    };
  }
  
  // Fallback: Try to get image by name from Scryfall API (slower, less reliable)
  // We'll handle this dynamically when needed
  return {};
};

/**
 * Fallback: Fetch image URL from Scryfall API by card name
 */
export const fetchImageUrlByName = async (cardName) => {
  try {
    const encodedName = encodeURIComponent(cardName);
    const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodedName}&format=json`);
    
    if (!response.ok) {
      return null;
    }
    
    const cardData = await response.json();
    
    if (cardData.image_uris) {
      return cardData.image_uris.normal;
    }
    
    // Handle double-faced cards
    if (cardData.card_faces && cardData.card_faces.length > 0) {
      return cardData.card_faces[0].image_uris?.normal || null;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch image for ${cardName}:`, error);
    return null;
  }
};

/**
 * Convert MTGJSON card format to Scryfall-like format
 */
const convertMTGJSONToScryfall = (card, set) => {
  const faces = card.faceName ? null : (card.faceNames || []);
  const isDoubleFaced = faces && faces.length > 0;
  
  // Get image URLs
  const image_uris = getCardImageUrls(card);
  
  // Build Scryfall-like structure
  const scryfallCard = {
    id: card.uuid || `${card.name}-${set.code}-${card.number}`,
    name: card.name,
    mana_cost: card.manaCost || '',
    cmc: card.convertedManaCost || 0,
    type_line: card.type || '',
    oracle_text: card.text || '',
    power: card.power,
    toughness: card.toughness,
    loyalty: card.loyalty,
    rarity: card.rarity || 'common',
    set_name: set.name || '',
    set: set.code || '',
    set_type: set.type || '',
    collector_number: card.number || '',
    released_at: set.releaseDate || '',
    // Image URLs from various sources
    image_uris: image_uris,
    // Store identifiers for future image fetching
    identifiers: card.identifiers || {},
    // Color identity
    color_identity: card.colorIdentity || [],
    colors: card.colors || [],
    keywords: card.keywords || [],
    // Prices - MTGJSON doesn't include prices, but we can leave empty
    prices: {},
    // Store original MTGJSON data for reference
    _mtgjson: card,
    _set: set,
    // Flag if we need to fetch images later
    _needsImageFetch: Object.keys(image_uris).length === 0
  };
  
  // Handle double-faced cards
  if (isDoubleFaced && card.otherFaceIds) {
    scryfallCard.card_faces = [];
    // Simplified - full implementation would need to fetch other faces
    // For now, we'll just note it's double-faced
    scryfallCard.layout = card.layout || 'normal';
  }
  
  return scryfallCard;
};

/**
 * Parse Scryfall search syntax and convert to MTGJSON-compatible search
 */
const parseSearchQuery = (query) => {
  const terms = [];
  const filters = {
    name: null,
    type: null,
    cmc: null,
    color: null,
    set: null,
    rarity: null,
    text: null
  };
  
  // Simple parser for common Scryfall search syntax
  const parts = query.split(/\s+/);
  
  parts.forEach(part => {
    if (part.includes(':')) {
      const [key, value] = part.split(':');
      const filterKey = key.toLowerCase();
      
      switch (filterKey) {
        case 'type':
        case 't':
          filters.type = value;
          break;
        case 'cmc':
        case 'mana':
          filters.cmc = parseInt(value) || null;
          break;
        case 'color':
        case 'c':
          filters.color = value.toLowerCase();
          break;
        case 'set':
        case 's':
          filters.set = value.toUpperCase();
          break;
        case 'rarity':
        case 'r':
          filters.rarity = value.toLowerCase();
          break;
        case 'o': // oracle text
        case 'oracle':
          filters.text = value;
          break;
        case 'is':
          // Handle "is:commander", "is:creature", etc.
          if (value === 'commander') {
            filters.type = 'Legendary Creature';
          }
          break;
        default:
          terms.push(part);
      }
    } else {
      terms.push(part);
    }
  });
  
  // Remaining terms are name search
  if (terms.length > 0) {
    filters.name = terms.join(' ');
  }
  
  return filters;
};

/**
 * Check if a card matches the search filters
 */
const cardMatchesFilters = (card, filters) => {
  // Name filter
  if (filters.name) {
    const nameLower = card.name?.toLowerCase() || '';
    const searchLower = filters.name.toLowerCase();
    if (!nameLower.includes(searchLower)) {
      return false;
    }
  }
  
  // Type filter
  if (filters.type) {
    const typeLower = (card.type_line || '').toLowerCase();
    const filterTypeLower = filters.type.toLowerCase();
    if (!typeLower.includes(filterTypeLower)) {
      return false;
    }
  }
  
  // CMC filter
  if (filters.cmc !== null) {
    if (card.cmc !== filters.cmc) {
      return false;
    }
  }
  
  // Color filter
  if (filters.color) {
    const cardColors = (card.colors || []).map(c => c.toLowerCase());
    if (!cardColors.includes(filters.color)) {
      return false;
    }
  }
  
  // Set filter
  if (filters.set) {
    if (card.set?.toUpperCase() !== filters.set) {
      return false;
    }
  }
  
  // Rarity filter
  if (filters.rarity) {
    if ((card.rarity || '').toLowerCase() !== filters.rarity) {
      return false;
    }
  }
  
  // Oracle text filter
  if (filters.text) {
    const textLower = (card.oracle_text || '').toLowerCase();
    if (!textLower.includes(filters.text.toLowerCase())) {
      return false;
    }
  }
  
  return true;
};

/**
 * Search for cards (similar to Scryfall searchCards)
 */
export const searchCards = async (query, page = 1) => {
  // Ensure data is loaded
  if (!cardsIndex) {
    await loadMTGJSONData();
  }
  
  if (!query || !query.trim()) {
    return { cards: [], hasMore: false, nextPage: null };
  }
  
  const filters = parseSearchQuery(query);
  const pageSize = 175; // Scryfall's default page size
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Filter cards
  const matchingCards = cardsIndex.filter(card => cardMatchesFilters(card, filters));
  
  // Get page of results
  const paginatedCards = matchingCards.slice(startIndex, endIndex);
  const hasMore = endIndex < matchingCards.length;
  
  return {
    cards: paginatedCards,
    hasMore: hasMore,
    nextPage: hasMore ? page + 1 : null
  };
};

/**
 * Get card by exact name (similar to Scryfall getCardByName)
 */
export const getCardByName = async (name) => {
  // Ensure data is loaded
  if (!cardsByNameIndex) {
    await loadMTGJSONData();
  }
  
  if (!name) return null;
  
  const nameKey = name.toLowerCase().trim();
  
  // Try exact match first
  const exactMatches = cardsByNameIndex.get(nameKey);
  if (exactMatches && exactMatches.length > 0) {
    // Return the most recent printing (sort by release date if available)
    const sortedMatches = exactMatches.sort((a, b) => {
      const dateA = new Date(a.released_at || 0);
      const dateB = new Date(b.released_at || 0);
      return dateB - dateA; // Most recent first
    });
    return sortedMatches[0];
  }
  
  // Try fuzzy match - find cards with similar names
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [cardName, cards] of cardsByNameIndex.entries()) {
    if (cardName.includes(nameKey) || nameKey.includes(cardName)) {
      const score = Math.min(cardName.length, nameKey.length) / Math.max(cardName.length, nameKey.length);
      if (score > bestScore && score > 0.7) { // 70% similarity threshold
        bestScore = score;
        // Get most recent printing
        const sortedCards = cards.sort((a, b) => {
          const dateA = new Date(a.released_at || 0);
          const dateB = new Date(b.released_at || 0);
          return dateB - dateA;
        });
        bestMatch = sortedCards[0];
      }
    }
  }
  
  return bestMatch;
};

/**
 * Get card by ID (similar to Scryfall getCardById)
 */
export const getCardById = async (id) => {
  // Ensure data is loaded
  if (!cardsIndex) {
    await loadMTGJSONData();
  }
  
  if (!id) return null;
  
  return cardsIndex.find(card => card.id === id) || null;
};

/**
 * Get random card (similar to Scryfall getRandomCard)
 */
export const getRandomCard = async () => {
  // Ensure data is loaded
  if (!cardsIndex) {
    await loadMTGJSONData();
  }
  
  if (!cardsIndex || cardsIndex.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * cardsIndex.length);
  return cardsIndex[randomIndex];
};

/**
 * Autocomplete card names (similar to Scryfall autocompleteCardName)
 */
export const autocompleteCardName = async (query) => {
  // Ensure data is loaded
  if (!cardsByNameIndex) {
    await loadMTGJSONData();
  }
  
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const queryLower = query.toLowerCase().trim();
  const suggestions = new Set();
  
  // Find matching card names
  for (const cardName of cardsByNameIndex.keys()) {
    if (cardName.startsWith(queryLower) || cardName.includes(queryLower)) {
      // Get the original case from the first card with this name
      const cards = cardsByNameIndex.get(cardName);
      if (cards && cards.length > 0) {
        suggestions.add(cards[0].name);
      }
    }
    
    // Limit results
    if (suggestions.size >= 20) {
      break;
    }
  }
  
  return Array.from(suggestions).slice(0, 20);
};

/**
 * Enhanced version that fetches missing images
 */
export const getCardWithImage = async (cardName) => {
  const card = await getCardByName(cardName);
  
  if (!card) {
    return null;
  }
  
  // If card has no image URLs, try to fetch from Scryfall API
  if (card._needsImageFetch || !card.image_uris || Object.keys(card.image_uris).length === 0) {
    try {
      const imageUrl = await fetchImageUrlByName(card.name);
      if (imageUrl) {
        card.image_uris = {
          normal: imageUrl,
          large: imageUrl,
          small: imageUrl
        };
        card._needsImageFetch = false;
      }
    } catch (error) {
      console.warn(`Could not fetch image for ${card.name}:`, error);
    }
  }
  
  return card;
};

// Add to mtgjsonApi.js, after the existing functions

/**
 * Fetch price data for a card
 */
export const fetchCardPrice = async (cardName) => {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.prices || null;
  } catch (error) {
    console.warn(`Failed to fetch price for ${cardName}:`, error);
    return null;
  }
};

/**
 * Get card with price data
 */
export const getCardWithPrice = async (cardName) => {
  const card = await getCardByName(cardName);
  if (!card) return null;
  
  // Try to fetch price if not already present
  if (!card.prices || Object.keys(card.prices).length === 0) {
    const prices = await fetchCardPrice(cardName);
    if (prices) {
      card.prices = prices;
    }
  }
  
  return card;
};

const mtgjsonApi = {
  loadMTGJSONData,
  searchCards,
  getCardByName,
  getCardById,
  getRandomCard,
  autocompleteCardName,
  fetchImageUrlByName,
  getCardWithImage,
  fetchCardPrice,
  getCardWithPrice
};

export default mtgjsonApi;