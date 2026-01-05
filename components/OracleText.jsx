import React from 'react';

// Parse oracle text and extract symbols in curly braces
const parseOracleText = (text) => {
  if (!text) return [];
  
  const parts = [];
  const symbolRegex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;
  
  while ((match = symbolRegex.exec(text)) !== null) {
    // Add text before the symbol
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add the symbol
    parts.push({
      type: 'symbol',
      content: match[1]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  // If no symbols found, return the whole text as a single part
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: text
    });
  }
  
  return parts;
};

// Convert symbol code to Scryfall symbol identifier
const getSymbolCode = (symbol) => {
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
      const [a, b] = parts;
      if (a.length === 1 && b.length === 1) {
        return `${a}${b}`;
      }
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
  
  return symbolMap[symbol] || symbol;
};

// Get Scryfall SVG URL for mana symbol
const getManaSymbolUrl = (symbolCode) => {
  return `https://svgs.scryfall.io/card-symbols/${symbolCode}.svg`;
};

export default function OracleText({ text, className = '' }) {
  if (!text) return null;
  
  // Handle multi-line text (for double-faced cards)
  const lines = text.split('\n');
  
  return (
    <div className={`oracle-text ${className}`}>
      {lines.map((line, lineIndex) => {
        if (line.trim() === '//') {
          return <div key={lineIndex} className="oracle-text-divider">//</div>;
        }
        
        const parts = parseOracleText(line);
        
        return (
          <div key={lineIndex} className="oracle-text-line">
            {parts.map((part, partIndex) => {
              if (part.type === 'text') {
                return <span key={partIndex}>{part.content}</span>;
              }
              
              // Render symbol
              const symbolCode = getSymbolCode(part.content);
              const symbolUrl = getManaSymbolUrl(symbolCode);
              
              return (
                <span key={partIndex} className="oracle-symbol-wrapper" title={part.content}>
                  <img
                    src={symbolUrl}
                    alt={`{${part.content}}`}
                    className="oracle-symbol"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'inline';
                      }
                    }}
                  />
                  <span className="oracle-symbol-fallback" style={{ display: 'none' }}>
                    {`{${part.content}}`}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

