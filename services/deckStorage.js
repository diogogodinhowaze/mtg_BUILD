// Deck storage service using localStorage

const STORAGE_KEY = 'mtg_decks';

// Get all decks
export const getAllDecks = () => {
  try {
    const decks = localStorage.getItem(STORAGE_KEY);
    return decks ? JSON.parse(decks) : [];
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
};

// Get deck by ID
export const getDeckById = (id) => {
  const decks = getAllDecks();
  return decks.find(deck => deck.id === id) || null;
};

// Save deck
export const saveDeck = (deck) => {
  try {
    const decks = getAllDecks();
    const existingIndex = decks.findIndex(d => d.id === deck.id);
    
    if (existingIndex >= 0) {
      decks[existingIndex] = deck;
    } else {
      decks.push(deck);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    console.error('Error saving deck:', error);
    return false;
  }
};

// Delete deck
export const deleteDeck = (id) => {
  try {
    const decks = getAllDecks();
    const filteredDecks = decks.filter(deck => deck.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDecks));
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
    return false;
  }
};

// Create new deck
export const createDeck = (name) => {
  const newDeck = {
    id: Date.now().toString(),
    name: name || 'Untitled Deck',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mainboard: [],
    sideboard: [],
    isCommander: false,
    commander: null
  };
  
  saveDeck(newDeck);
  return newDeck;
};

// Extract colors from a card (including colorless from mana_cost)
// Handles both regular cards and double-faced cards
const getCardColors = (cardData) => {
  const colorSet = new Set();
  
  // Handle double-faced cards
  if (cardData?.card_faces && cardData.card_faces.length > 0) {
    // Combine colors from all faces
    cardData.card_faces.forEach(face => {
      // Add colors from color_identity (each face may have its own)
      if (face.color_identity) {
        face.color_identity.forEach(color => {
          colorSet.add(color);
        });
      }
      // Check mana_cost for colorless symbol {C}
      if (face.mana_cost && face.mana_cost.includes('{C}')) {
        colorSet.add('C');
      }
    });
    // Also check the main card's color_identity (usually combines both faces)
    if (cardData.color_identity) {
      cardData.color_identity.forEach(color => {
        colorSet.add(color);
      });
    }
  } else {
    // Regular cards
    // Add colors from color_identity
    if (cardData?.color_identity) {
      cardData.color_identity.forEach(color => {
        colorSet.add(color);
      });
    }
    
    // Check mana_cost for colorless symbol {C}
    if (cardData?.mana_cost) {
      const manaCost = cardData.mana_cost;
      // Check if mana cost contains {C} symbol
      if (manaCost.includes('{C}')) {
        colorSet.add('C');
      }
    }
  }
  
  return Array.from(colorSet);
};

// Get deck color identity
export const getDeckColors = (deck) => {
  const colorSet = new Set();
  
  // For commander decks, use commander's colors - support partner commanders
  if (deck.isCommander && deck.commander) {
    if (Array.isArray(deck.commander)) {
      // Partner commanders - combine colors from both
      deck.commander.forEach(cmd => {
        if (cmd.cardData) {
          const commanderColors = getCardColors(cmd.cardData);
          commanderColors.forEach(color => {
            colorSet.add(color);
          });
        }
      });
    } else {
      // Single commander
      if (deck.commander.cardData) {
        const commanderColors = getCardColors(deck.commander.cardData);
        commanderColors.forEach(color => {
          colorSet.add(color);
        });
      }
    }
  }
  
  // For regular decks, collect all unique colors from mainboard
  const mainboard = deck.mainboard || [];
  mainboard.forEach(card => {
    if (card.cardData) {
      const cardColors = getCardColors(card.cardData);
      cardColors.forEach(color => {
        colorSet.add(color);
      });
    }
  });
  
  return Array.from(colorSet).sort();
};

// Calculate deck statistics
export const getDeckStats = (deck) => {
  const mainboard = deck.mainboard || [];
  const sideboard = deck.sideboard || [];
  
  // Don't include commander in mainboard count - commander is separate
  const mainboardCount = mainboard.reduce((sum, card) => sum + card.quantity, 0);
  const sideboardCount = sideboard.reduce((sum, card) => sum + card.quantity, 0);
  
  // Total count includes commander(s) if present - support partner commanders
  let commanderCount = 0;
  if (deck.isCommander && deck.commander) {
    if (Array.isArray(deck.commander)) {
      commanderCount = deck.commander.length; // Partner commanders
    } else {
      commanderCount = 1; // Single commander
    }
  }
  const totalCount = mainboardCount + sideboardCount + commanderCount;
  
  // Count by color
  const colors = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  
  // Include commander(s) in color counting - support partner commanders
  if (deck.isCommander && deck.commander) {
    if (Array.isArray(deck.commander)) {
      // Partner commanders
      deck.commander.forEach(cmd => {
        if (cmd.cardData?.color_identity) {
          cmd.cardData.color_identity.forEach(color => {
            if (colors.hasOwnProperty(color)) {
              colors[color] += 1;
            }
          });
        }
      });
    } else {
      // Single commander
      if (deck.commander.cardData?.color_identity) {
        deck.commander.cardData.color_identity.forEach(color => {
          if (colors.hasOwnProperty(color)) {
            colors[color] += 1;
          }
        });
      }
    }
  }
  
  mainboard.forEach(card => {
    if (card.cardData?.color_identity) {
      card.cardData.color_identity.forEach(color => {
        if (colors.hasOwnProperty(color)) {
          colors[color] += card.quantity;
        }
      });
    }
  });
  
  return {
    mainboardCount,
    sideboardCount,
    totalCount,
    commanderCount,
    colors,
    isLegal: mainboardCount >= 60 && mainboardCount <= 100 && sideboardCount <= 15
  };
};

// Export all decks to JSON file
export const exportAllDecksToJSON = () => {
  const decks = getAllDecks();
  const dataStr = JSON.stringify(decks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'decks.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export single deck to TXT file (for easy import)
export const exportDeckToTXT = (deckId) => {
  const deck = getDeckById(deckId);
  if (!deck) return false;

  let txtContent = `${deck.name}\n`;
  txtContent += `Created: ${new Date(deck.createdAt).toLocaleDateString()}\n`;
  txtContent += `Updated: ${new Date(deck.updatedAt).toLocaleDateString()}\n\n`;
  
  txtContent += 'Mainboard:\n';
  deck.mainboard.forEach(card => {
    txtContent += `${card.quantity}x ${card.cardData.name}\n`;
  });
  
  if (deck.sideboard && deck.sideboard.length > 0) {
    txtContent += '\nSideboard:\n';
    deck.sideboard.forEach(card => {
      txtContent += `${card.quantity}x ${card.cardData.name}\n`;
    });
  }

  const dataBlob = new Blob([txtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  const safeFileName = deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${safeFileName}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

// Import decks from JSON file
export const importDecksFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedDecks = JSON.parse(e.target.result);
        if (!Array.isArray(importedDecks)) {
          reject(new Error('Invalid format: Expected an array of decks'));
          return;
        }

        const existingDecks = getAllDecks();
        const existingIds = new Set(existingDecks.map(d => d.id));
        let importedCount = 0;
        
        // Merge decks, avoiding duplicates by ID
        importedDecks.forEach(deck => {
          if (!existingIds.has(deck.id)) {
            // Ensure deck has required structure
            if (deck.name && Array.isArray(deck.mainboard)) {
              if (!deck.sideboard) deck.sideboard = [];
              if (!deck.createdAt) deck.createdAt = new Date().toISOString();
              if (!deck.updatedAt) deck.updatedAt = new Date().toISOString();
              existingDecks.push(deck);
              importedCount++;
            }
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingDecks));
        resolve(importedCount);
      } catch (error) {
        reject(new Error('Failed to parse JSON file: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Import deck from TXT content (used by both file and URL imports)
export const importDeckFromTXTContent = async (content, deckName, getCardByName) => {
  return new Promise(async (resolve, reject) => {
    try {
        if (!content || !content.trim()) {
          throw new Error('Deck content is empty');
        }
        
        // Check if content is HTML (shouldn't happen, but handle it)
        if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
          throw new Error('Received HTML instead of deck data. The deck may be private or the import URL is incorrect. Please ensure the deck is set to "Public" on Moxfield, or export it manually as a .txt file.');
        }
        
        const lines = content.split('\n').map(l => l.trim());
        console.log('Parsing deck with', lines.length, 'lines'); // Debug
        console.log('First 10 lines:', lines.slice(0, 10)); // Debug
        
        // Use provided deck name or default
        const finalDeckName = deckName || 'Imported Deck';
        
        let currentSection = 'mainboard';
        const mainboardCards = [];
        const sideboardCards = [];
        let commanderCard = null;
        let isCommanderDeck = false;
        let i = 0;
        
        // Skip header/metadata lines (deck name, dates, etc.)
        // Moxfield might start with deck name or metadata
        while (i < lines.length) {
          const line = lines[i];
          const lineLower = line.toLowerCase();
          
          // Skip empty lines
          if (!line) {
            i++;
            continue;
          }
          
          // Skip metadata lines
          if (lineLower.startsWith('created:') || 
              lineLower.startsWith('updated:') ||
              lineLower.startsWith('format:') ||
              lineLower.startsWith('author:') ||
              line.includes('://') || // URLs
              line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) { // Dates
            i++;
            continue;
          }
          
          // Check if file starts with // COMMANDER or COMMANDER
          if (lineLower.includes('// commander') || lineLower === 'commander') {
            isCommanderDeck = true;
            i++; // Skip the // COMMANDER line
            
            // Skip empty lines after // COMMANDER
            while (i < lines.length && !lines[i]) {
              i++;
            }
            
            // Next non-empty line is the commander
            if (i < lines.length && lines[i]) {
              const commanderLine = lines[i];
              // Parse commander: "1 Card Name", "1x Card Name", or "Card Name"
              const commanderMatch = commanderLine.match(/^(\d+)\s*[xX]?\s+(.+)$/) || 
                                     commanderLine.match(/^(\d+)\s+(.+)$/) || 
                                     commanderLine.match(/^(.+)$/);
              if (commanderMatch) {
                const commanderName = commanderMatch[2] || commanderMatch[1];
                commanderCard = { name: commanderName.trim() };
                i++; // Skip the commander line
              }
            }
            continue;
          }
          
          // Check for section markers
          if (lineLower.includes('// sideboard') || lineLower === 'sideboard' || lineLower.startsWith('sideboard:')) {
            currentSection = 'sideboard';
            i++;
            continue;
          }
          
          if (lineLower.includes('// mainboard') || lineLower === 'mainboard' || lineLower.startsWith('mainboard:')) {
            currentSection = 'mainboard';
            i++;
            continue;
          }
          
          // If we get here, it should be a card line
          break;
        }
        
        // Parse the rest of the file
        for (; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue; // Skip empty lines
          
          const lineLower = line.toLowerCase();
          
          // Check for section markers (in case they appear later)
          if (lineLower.includes('// sideboard') || lineLower === 'sideboard' || lineLower.startsWith('sideboard:')) {
            currentSection = 'sideboard';
            continue;
          }
          
          if (lineLower.includes('// mainboard') || lineLower === 'mainboard' || lineLower.startsWith('mainboard:')) {
            currentSection = 'mainboard';
            continue;
          }
          
          if (lineLower.includes('// commander') || lineLower === 'commander') {
            continue; // Skip commander section headers
          }
          
          // Skip metadata lines that might appear later
          if (lineLower.startsWith('created:') || 
              lineLower.startsWith('updated:') ||
              lineLower.startsWith('format:') ||
              line.includes('://')) {
            continue;
          }
          
          // Parse card line: Multiple formats supported
          // Formats: "1 Card Name", "1x Card Name", "1 Card Name (SET) 123 *F*"
          // Pattern: quantity (optional x) card name (optional set code) (optional numbers/markers)
          let match = null;
          let quantity = 1;
          let cardName = '';
          
          // Try "1x Card Name (SET) 123 *F*" format
          match = line.match(/^(\d+)\s*[xX]\s+(.+)$/);
          if (match) {
            quantity = parseInt(match[1], 10);
            cardName = match[2];
          }
          
          // Try "1 Card Name (SET) 123 *F*" format
          if (!match) {
            match = line.match(/^(\d+)\s+(.+)$/);
            if (match) {
              quantity = parseInt(match[1], 10);
              cardName = match[2];
            }
          }
          
          // Try "Card Name (SET) 123 *F*" format (no quantity)
          if (!match) {
            match = line.match(/^(.+)$/);
            if (match) {
              quantity = 1;
              cardName = match[1];
            }
          }
          
          if (match && cardName) {
            // Clean up the card name:
            // Remove set code in parentheses: "Card Name (SET)" -> "Card Name"
            cardName = cardName.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
            
            // Remove trailing numbers: "Card Name 2226" -> "Card Name"
            cardName = cardName.replace(/\s+\d+\s*$/, '').trim();
            
            // Remove trailing markers: "Card Name *F*" -> "Card Name"
            cardName = cardName.replace(/\s+\*[^*]+\*\s*$/, '').trim();
            
            // Final trim
            cardName = cardName.trim();
            
            // Allow quantities up to 100 (for commander decks)
            if (cardName && cardName.length > 0 && quantity > 0 && quantity <= 100) {
              // Make sure it's not just a number or special character
              if (cardName.length > 1 && !cardName.match(/^[\d\s\-_]+$/)) {
                if (currentSection === 'mainboard') {
                  mainboardCards.push({ name: cardName, quantity });
                } else {
                  sideboardCards.push({ name: cardName, quantity });
                }
              }
            }
          }
        }
        
        const totalMainboardQuantity = mainboardCards.reduce((sum, card) => sum + card.quantity, 0);
        console.log('Parsed cards - Mainboard entries:', mainboardCards.length, 'Total quantity:', totalMainboardQuantity, 'Sideboard:', sideboardCards.length, 'Commander:', commanderCard?.name); // Debug
        
        // If no commander was detected but we have exactly 99 cards in mainboard, 
        // treat the first card as commander (typical commander deck format)
        // Also check if we have 100 cards total (commander + 99 others)
        // Support partner commanders: if first card has partner, check if second card also has partner
        if (!commanderCard && mainboardCards.length > 0) {
          // Commander decks typically have 99 cards (1 commander + 98 others, or commander included in 99)
          // Or 100 cards total (1 commander + 99 others, or 2 partner commanders + 98 others)
          if (totalMainboardQuantity === 99 || totalMainboardQuantity === 100 || (totalMainboardQuantity >= 98 && totalMainboardQuantity <= 100)) {
            console.log(`Detected commander deck by card count (${totalMainboardQuantity} cards), treating first card as commander:`, mainboardCards[0]?.name);
            isCommanderDeck = true;
            commanderCard = mainboardCards.shift(); // Remove first card and make it the commander
            console.log('Commander set to:', commanderCard?.name);
          }
        }
        
        if (mainboardCards.length === 0 && sideboardCards.length === 0 && !commanderCard) {
          console.warn('No cards found in deck content. Content preview:', content.substring(0, 200));
          throw new Error('No cards found in deck. The deck may be empty or in an unsupported format.');
        }

        // Fetch card data from MTGJSON
        const newDeck = {
          id: Date.now().toString(),
          name: finalDeckName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mainboard: [],
          sideboard: [],
          isCommander: isCommanderDeck,
          commander: null
        };

        // Fetch commander card(s) if present - support partner commanders
        if (commanderCard && isCommanderDeck) {
          console.log('Fetching commander:', commanderCard.name);
          const commanderData = await getCardByName(commanderCard.name);
          if (commanderData) {
            console.log('Commander found:', commanderData.name);
            
            // Check if this commander has "partner" ability
            const hasPartner = commanderData.keywords?.some(k => k.toLowerCase().includes('partner')) ||
                              commanderData.oracle_text?.toLowerCase().includes('partner') ||
                              commanderData.type_line?.toLowerCase().includes('partner');
            
            if (hasPartner && mainboardCards.length > 0) {
              // Check if next card also has partner
              const nextCard = mainboardCards[0];
              console.log('First commander has partner, checking next card:', nextCard.name);
              const nextCardData = await getCardByName(nextCard.name);
              
              if (nextCardData) {
                const nextHasPartner = nextCardData.keywords?.some(k => k.toLowerCase().includes('partner')) ||
                                      nextCardData.oracle_text?.toLowerCase().includes('partner') ||
                                      nextCardData.type_line?.toLowerCase().includes('partner');
                
                if (nextHasPartner) {
                  console.log('Both cards have partner - setting as partner commanders');
                  // Remove the second commander from mainboard
                  mainboardCards.shift();
                  // Store both as commanders (array)
                  newDeck.commander = [
                    { cardData: commanderData },
                    { cardData: nextCardData }
                  ];
                } else {
                  // Single commander
                  newDeck.commander = { cardData: commanderData };
                }
              } else {
                // Single commander (couldn't fetch second card)
                newDeck.commander = { cardData: commanderData };
              }
            } else {
              // Single commander (no partner)
              newDeck.commander = { cardData: commanderData };
            }
          } else {
            console.warn('Commander not found in MTGJSON:', commanderCard.name);
            // Try without comma if it has one (e.g., "Jin Sakai, Ghost of Tsushima" -> "Jin Sakai Ghost of Tsushima")
            const altName = commanderCard.name.replace(/,/g, '');
            console.log('Trying alternative name:', altName);
            const altCommanderData = await getCardByName(altName);
            if (altCommanderData) {
              console.log('Commander found with alternative name:', altCommanderData.name);
              newDeck.commander = { cardData: altCommanderData };
            }
          }
        }

        // Fetch mainboard cards
        const fetchedMainboard = [];
        const failedCards = [];
        for (const cardEntry of mainboardCards) {
          try {
            const cardData = await getCardByName(cardEntry.name);
            if (cardData) {
              for (let j = 0; j < cardEntry.quantity; j++) {
                fetchedMainboard.push({
                  cardData,
                  quantity: 1
                });
              }
            } else {
              console.warn(`Card not found: ${cardEntry.name}`);
              failedCards.push(cardEntry.name);
            }
          } catch (err) {
            console.warn(`Error fetching card ${cardEntry.name}:`, err);
            failedCards.push(cardEntry.name);
          }
        }
        
        if (failedCards.length > 0) {
          console.warn(`Failed to fetch ${failedCards.length} cards:`, failedCards);
        }
        
        console.log(`Successfully fetched ${fetchedMainboard.length} mainboard card instances`);

        // Fetch sideboard cards
        const fetchedSideboard = [];
        for (const cardEntry of sideboardCards) {
          try {
            const cardData = await getCardByName(cardEntry.name);
            if (cardData) {
              for (let j = 0; j < cardEntry.quantity; j++) {
                fetchedSideboard.push({
                  cardData,
                  quantity: 1
                });
              }
            } else {
              console.warn(`Card not found: ${cardEntry.name}`);
            }
          } catch (err) {
            console.warn(`Error fetching card ${cardEntry.name}:`, err);
          }
        }

        // Merge quantities
        const mergeQuantities = (board) => {
          const merged = {};
          board.forEach(card => {
            const key = card.cardData.id;
            if (!merged[key]) {
              merged[key] = { ...card, quantity: 0 };
            }
            merged[key].quantity += 1;
          });
          return Object.values(merged);
        };

        newDeck.mainboard = mergeQuantities(fetchedMainboard);
        newDeck.sideboard = mergeQuantities(fetchedSideboard);

        saveDeck(newDeck);
        resolve(newDeck);
    } catch (error) {
      reject(new Error('Failed to parse TXT content: ' + error.message));
    }
  });
};

// Import deck from TXT file
export const importDeckFromTXT = async (file, getCardByName) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const deckName = file.name.replace(/\.txt$/i, '').trim();
        const deck = await importDeckFromTXTContent(content, deckName, getCardByName);
        resolve(deck);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Convert deck website URLs to export format
const convertDeckURLToExport = (url) => {
  const urlLower = url.toLowerCase();
  
  // Moxfield: https://moxfield.com/decks/[deckId] or https://www.moxfield.com/decks/[deckId]
  if (urlLower.includes('moxfield.com/decks/')) {
    const deckIdMatch = url.match(/moxfield\.com\/decks\/([^\/\?#]+)/i);
    if (deckIdMatch) {
      const deckId = deckIdMatch[1];
      // Moxfield export format - try TXT first (more likely to work with CORS)
      return {
        exportUrl: `https://api.moxfield.com/v2/decks/all/${deckId}`,
        txtUrl: `https://www.moxfield.com/decks/${deckId}/txt`,
        deckId: deckId
      };
    }
  }
  
  // Archidekt: https://www.archidekt.com/decks/[deckId] -> API endpoint
  if (urlLower.includes('archidekt.com/decks/')) {
    const deckIdMatch = url.match(/archidekt\.com\/decks\/([^\/\?#]+)/i);
    if (deckIdMatch) {
      const deckId = deckIdMatch[1];
      return {
        apiUrl: `https://www.archidekt.com/api/decks/${deckId}/`,
        exportUrl: `https://www.archidekt.com/decks/${deckId}/export/`
      };
    }
  }
  
  // Manabox: Check for deck sharing URLs
  if (urlLower.includes('manabox.app')) {
    // Manabox might use direct deck URLs - try to extract deck ID
    const deckIdMatch = url.match(/manabox\.app\/.*\/([^\/\?#]+)/i);
    if (deckIdMatch) {
      return {
        exportUrl: url
      };
    }
    return { exportUrl: url };
  }
  
  // TappedOut: https://tappedout.net/mtg-decks/[deck-name]/ -> https://tappedout.net/mtg-decks/[deck-name]/?fmt=txt
  if (urlLower.includes('tappedout.net/mtg-decks/')) {
    // Remove query params and add txt format
    const baseUrl = url.split('?')[0];
    return {
      exportUrl: `${baseUrl}?fmt=txt`
    };
  }
  
  // If not a recognized deck site, return as-is
  return { exportUrl: url };
};

// Import deck from URL (supports Moxfield, Archidekt, Manabox, TappedOut)
export const importDeckFromURL = async (url, getCardByName) => {
  try {
    // Check if it's a supported deck website
    const urlLower = url.toLowerCase();
    const isDeckWebsite = urlLower.includes('moxfield.com') || 
                         urlLower.includes('archidekt.com') || 
                         urlLower.includes('manabox.app') || 
                         urlLower.includes('tappedout.net');
    
    if (!isDeckWebsite) {
      throw new Error('Please use a URL from Moxfield, Archidekt, Manabox, or TappedOut');
    }
    
    // Convert URL to export format
    const urlInfo = convertDeckURLToExport(url);
    let fetchUrl = urlInfo.exportUrl || urlInfo.txtUrl || url;
    let deckName = 'Imported Deck';
    let content = '';
    
    // For Moxfield, try API first (more reliable and structured)
    if (urlLower.includes('moxfield.com') && urlInfo.exportUrl && urlInfo.exportUrl.includes('api.moxfield.com')) {
      try {
        // Try direct API fetch first
        let apiResponse;
        let rawData;
        try {
          apiResponse = await fetch(urlInfo.exportUrl, {
            method: 'GET',
            mode: 'cors'
          });
          if (apiResponse.ok) {
            rawData = await apiResponse.text();
          }
        } catch (corsError) {
          // CORS error - try with proxy
          console.warn('Direct API fetch failed (CORS?), trying proxy:', corsError);
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlInfo.exportUrl)}`;
          apiResponse = await fetch(proxyUrl);
          if (apiResponse.ok) {
            const proxyResponse = await apiResponse.text();
            // Handle proxy JSON response
            try {
              const proxyData = JSON.parse(proxyResponse);
              rawData = proxyData.contents || proxyData.status?.content || proxyResponse;
            } catch (e) {
              rawData = proxyResponse;
            }
          }
        }
        
        if (apiResponse && apiResponse.ok && rawData) {
          // Check if we got HTML instead of JSON (proxy might have redirected)
          if (typeof rawData === 'string' && (rawData.trim().startsWith('<!DOCTYPE') || rawData.trim().startsWith('<html'))) {
            throw new Error('Received HTML instead of deck data. The deck may be private or require authentication. Please ensure the deck is set to "Public" on Moxfield, or export it manually as a .txt file and import it.');
          }
          
          // Parse JSON response
          let deckData;
          try {
            deckData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          } catch (e) {
            throw new Error('Failed to parse Moxfield API response as JSON. Response: ' + rawData.substring(0, 200));
          }
          
          console.log('Moxfield API response:', deckData); // Debug
          
          deckName = deckData.name || deckName;
          
          // Convert Moxfield deck format to text format
          const mainboard = deckData.mainboard || {};
          const sideboard = deckData.sideboard || {};
          const commanders = deckData.commanders || [];
          
          console.log('Moxfield deck structure - Commanders:', commanders.length, 'Mainboard cards:', Object.keys(mainboard).length, 'Sideboard cards:', Object.keys(sideboard).length); // Debug
          
          let deckText = '';
          
          // Add commander if present
          if (commanders.length > 0) {
            deckText += '// COMMANDER\n';
            commanders.forEach(cmd => {
              const qty = cmd.quantity || 1;
              const cardName = cmd.card?.name || cmd.name;
              if (cardName) {
                deckText += `${qty} ${cardName}\n`;
              }
            });
            deckText += '\n';
          }
          
          // Add mainboard
          Object.values(mainboard).forEach(card => {
            const qty = card.quantity || 1;
            const cardName = card.card?.name || card.name;
            if (cardName) {
              deckText += `${qty} ${cardName}\n`;
            }
          });
          
          // Add sideboard if present
          if (Object.keys(sideboard).length > 0) {
            deckText += '\n// SIDEBOARD\n';
            Object.values(sideboard).forEach(card => {
              const qty = card.quantity || 1;
              const cardName = card.card?.name || card.name;
              if (cardName) {
                deckText += `${qty} ${cardName}\n`;
              }
            });
          }
          
          console.log('Generated deck text (first 500 chars):', deckText.substring(0, 500)); // Debug
          
          if (!deckText.trim()) {
            throw new Error('Moxfield API returned an empty deck');
          }
          
          content = deckText;
        } else {
          throw new Error(`API failed: ${apiResponse?.statusText || 'Unknown error'}`);
        }
      } catch (apiError) {
        console.warn('Moxfield API failed, trying TXT export:', apiError);
        
        // Fall back to TXT export
        if (urlInfo.txtUrl) {
          try {
            let txtResponse;
            try {
              txtResponse = await fetch(urlInfo.txtUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                  'Accept': 'text/plain'
                }
              });
            } catch (corsError) {
              const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlInfo.txtUrl)}`;
              txtResponse = await fetch(proxyUrl);
            }
            
            if (txtResponse && txtResponse.ok) {
              let rawContent = await txtResponse.text();
              
              // Handle proxy response
              let extractedContent = rawContent;
              try {
                const proxyData = JSON.parse(rawContent);
                extractedContent = proxyData.contents || proxyData.status?.content || rawContent;
              } catch (e) {
                // Not JSON, use as-is
                extractedContent = rawContent;
              }
              
              // Check if we got HTML instead of text
              if (extractedContent.trim().startsWith('<!DOCTYPE') || extractedContent.trim().startsWith('<html')) {
                throw new Error('TXT export returned HTML. The deck may be private. Please make sure the deck is set to "Public" on Moxfield, or export it manually as a .txt file.');
              }
              
              content = extractedContent;
              
              if (urlInfo.deckId) {
                deckName = `Moxfield Deck ${urlInfo.deckId}`;
              }
            } else {
              throw new Error(`TXT export also failed: ${txtResponse?.statusText || 'Unknown error'}`);
            }
          } catch (txtError) {
            throw new Error(`Failed to import from Moxfield. Please ensure the deck is public. You can also export the deck as a .txt file from Moxfield and import it manually. Error: ${apiError.message}`);
          }
        } else {
          throw new Error(`Failed to import from Moxfield. Please ensure the deck is public. You can also export the deck as a .txt file from Moxfield and import it manually. Error: ${apiError.message}`);
        }
      }
    }
    
    // Try Archidekt API
    if (urlLower.includes('archidekt.com') && urlInfo.apiUrl) {
      try {
        const apiResponse = await fetch(urlInfo.apiUrl);
        if (apiResponse.ok) {
          const deckData = await apiResponse.json();
          deckName = deckData.name || deckName;
          
          // Convert Archidekt format to text
          let deckText = '';
          
          // Check for commander
          const commanders = deckData.cards?.filter(c => c.category === 'Commander') || [];
          if (commanders.length > 0) {
            deckText += '// COMMANDER\n';
            commanders.forEach(cmd => {
              deckText += `${cmd.quantity} ${cmd.card.oracle_card.name}\n`;
            });
            deckText += '\n';
          }
          
          // Mainboard
          const mainboard = deckData.cards?.filter(c => c.category === 'Mainboard') || [];
          mainboard.forEach(card => {
            deckText += `${card.quantity} ${card.card.oracle_card.name}\n`;
          });
          
          // Sideboard
          const sideboard = deckData.cards?.filter(c => c.category === 'Sideboard') || [];
          if (sideboard.length > 0) {
            deckText += '\n// SIDEBOARD\n';
            sideboard.forEach(card => {
              deckText += `${card.quantity} ${card.card.oracle_card.name}\n`;
            });
          }
          
          content = deckText;
        }
      } catch (e) {
        // Fall back to export URL
        console.warn('Archidekt API failed, trying export URL:', e);
        fetchUrl = urlInfo.exportUrl;
      }
    }
    
    // If we don't have content yet, fetch from URL
    if (!content) {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch deck from URL: ${response.statusText}`);
      }
      content = await response.text();
    }
    
    // Extract deck name from URL if not already set
    if (deckName === 'Imported Deck') {
      const urlParts = fetchUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      deckName = fileName.replace(/\.txt$/i, '').replace(/\.json$/i, '').trim() || 'Imported Deck';
    }
    
    // Parse as TXT deck list
    const deck = await importDeckFromTXTContent(content, deckName, getCardByName);
    return { type: 'single', deck };
  } catch (error) {
    throw new Error('Failed to import deck from URL: ' + error.message);
  }
};

export default {
  getAllDecks,
  getDeckById,
  saveDeck,
  deleteDeck,
  createDeck,
  getDeckStats,
  exportAllDecksToJSON,
  exportDeckToTXT,
  importDecksFromJSON,
  importDeckFromTXT,
  importDeckFromURL,
  importDeckFromTXTContent
};


