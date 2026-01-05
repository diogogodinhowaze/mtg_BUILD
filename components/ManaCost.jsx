import React from 'react';

// Parse mana cost string and return array of symbols
const parseManaCost = (manaCost) => {
  if (!manaCost) return [];
  
  // Match all mana symbols in curly braces: {W}, {U}, {R/G}, {2}, etc.
  const symbolRegex = /\{([^}]+)\}/g;
  const symbols = [];
  let match;
  
  while ((match = symbolRegex.exec(manaCost)) !== null) {
    symbols.push(match[1]);
  }
  
  return symbols;
};

// Convert symbol code to Scryfall symbol identifier
const getSymbolCode = (symbol) => {
  // Handle hybrid/mana symbols
  const symbolMap = {
    'W': 'W',
    'U': 'U',
    'B': 'B',
    'R': 'R',
    'G': 'G',
    'C': 'C',
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    '11': '11',
    '12': '12',
    '13': '13',
    '14': '14',
    '15': '15',
    '16': '16',
    '17': '17',
    '18': '18',
    '19': '19',
    '20': '20',
    'X': 'X',
    'Y': 'Y',
    'Z': 'Z',
    'S': 'S', // Snow
    'P': 'P', // Phyrexian
    'T': 'T', // Tap
    'Q': 'Q', // Untap
    'E': 'E', // Energy
    'PW': 'PW', // Planeswalker
    'CHAOS': 'CHAOS',
    'TK': 'TK', // Ticket
  };
  
  // Handle hybrid symbols like R/G, W/U, etc.
  if (symbol.includes('/')) {
    const parts = symbol.split('/');
    if (parts.length === 2) {
      // Two-color hybrid
      const [a, b] = parts;
      if (a.length === 1 && b.length === 1) {
        return `${a}${b}`;
      }
      // Phyrexian or other special hybrids
      if (a === 'P' || b === 'P') {
        const color = a === 'P' ? b : a;
        return `P${color}`;
      }
    }
  }
  
  // Handle phyrexian mana
  if (symbol.endsWith('/P') || symbol.startsWith('P/')) {
    const color = symbol.replace(/[P\/]/g, '');
    return `P${color}`;
  }
  
  // Return mapped symbol or the symbol itself
  return symbolMap[symbol] || symbol;
};

// Get Scryfall SVG URL for mana symbol
const getManaSymbolUrl = (symbolCode) => {
  // Scryfall provides mana symbols at this URL pattern
  return `https://svgs.scryfall.io/card-symbols/${symbolCode}.svg`;
};

export default function ManaCost({ manaCost, className = '' }) {
  if (!manaCost) return null;
  
  const symbols = parseManaCost(manaCost);
  
  if (symbols.length === 0) return null;
  
  return (
    <span className={`mana-cost ${className}`}>
      {symbols.map((symbol, index) => {
        const symbolCode = getSymbolCode(symbol);
        const symbolUrl = getManaSymbolUrl(symbolCode);
        
        return (
          <span key={index} className="mana-symbol-wrapper" title={symbol}>
            <img
              src={symbolUrl}
              alt={`{${symbol}}`}
              className="mana-symbol"
              onError={(e) => {
                // Fallback: show text if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span className="mana-symbol-fallback" style={{ display: 'none' }}>
              {`{${symbol}}`}
            </span>
          </span>
        );
      })}
    </span>
  );
}

