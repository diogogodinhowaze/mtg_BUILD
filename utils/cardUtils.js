// Utility functions for handling MTG cards, including double-faced cards

/**
 * Get the image URL for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {string} - The image URL or empty string
 */
export const getCardImage = (card) => {
  if (!card) return '';
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Use the front face (first face)
    const frontFace = card.card_faces[0];
    return frontFace.image_uris?.normal || frontFace.image_uris?.large || frontFace.image_uris?.small || '';
  }
  
  // Regular cards have image_uris directly
  return card.image_uris?.normal || card.image_uris?.large || card.image_uris?.small || '';
};

/**
 * Get the mana cost for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {string} - The mana cost or empty string
 */
export const getCardManaCost = (card) => {
  if (!card) return '';
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Use the front face (first face) mana cost
    return card.card_faces[0].mana_cost || '';
  }
  
  // Regular cards have mana_cost directly
  return card.mana_cost || '';
};

/**
 * Get the type line for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {string} - The type line or empty string
 */
export const getCardTypeLine = (card) => {
  if (!card) return '';
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Combine both faces' type lines
    return card.card_faces.map(face => face.type_line).filter(Boolean).join(' // ') || card.type_line || '';
  }
  
  // Regular cards have type_line directly
  return card.type_line || '';
};

/**
 * Get the oracle text for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {string} - The oracle text or empty string
 */
export const getCardOracleText = (card) => {
  if (!card) return '';
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Combine both faces' oracle text
    return card.card_faces.map(face => face.oracle_text).filter(Boolean).join('\n\n//\n\n') || card.oracle_text || '';
  }
  
  // Regular cards have oracle_text directly
  return card.oracle_text || '';
};

/**
 * Get the power for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {string|null} - The power or null
 */
export const getCardPower = (card) => {
  if (!card) return null;
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Check if any face has power (usually the front face for creatures)
    for (const face of card.card_faces) {
      if (face.power !== null && face.power !== undefined) {
        return face.power;
      }
    }
    return null;
  }
  
  // Regular cards have power directly
  return card.power !== null && card.power !== undefined ? card.power : null;
};

/**
 * Get the toughness for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {string|null} - The toughness or null
 */
export const getCardToughness = (card) => {
  if (!card) return null;
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Check if any face has toughness (usually the front face for creatures)
    for (const face of card.card_faces) {
      if (face.toughness !== null && face.toughness !== undefined) {
        return face.toughness;
      }
    }
    return null;
  }
  
  // Regular cards have toughness directly
  return card.toughness !== null && card.toughness !== undefined ? card.toughness : null;
};

/**
 * Get the loyalty for a card (handles double-faced cards)
 * @param {Object} card - The card object from Scryfall
 * @returns {number|null} - The loyalty or null
 */
export const getCardLoyalty = (card) => {
  if (!card) return null;
  
  // Double-faced cards have card_faces array
  if (card.card_faces && card.card_faces.length > 0) {
    // Check if any face has loyalty (usually the front face for planeswalkers)
    for (const face of card.card_faces) {
      if (face.loyalty !== null && face.loyalty !== undefined) {
        return face.loyalty;
      }
    }
    return null;
  }
  
  // Regular cards have loyalty directly
  return card.loyalty !== null && card.loyalty !== undefined ? card.loyalty : null;
};

