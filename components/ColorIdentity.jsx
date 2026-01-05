import React from 'react';

// Get Scryfall SVG URL for mana symbol
const getManaSymbolUrl = (color) => {
  // Ensure uppercase for consistency (Scryfall uses uppercase)
  const symbolCode = color.toUpperCase();
  return `https://svgs.scryfall.io/card-symbols/${symbolCode}.svg`;
};

export default function ColorIdentity({ colorIdentity, className = '', size = 'small' }) {
  if (!colorIdentity || colorIdentity.length === 0) {
    return null;
  }

  const sizeClass = size === 'large' ? 'color-large' : 'color-small';
  // Sort colors: W, U, B, R, G, C
  const colorOrder = ['W', 'U', 'B', 'R', 'G', 'C'];
  const sortedColors = [...colorIdentity].sort((a, b) => {
    const aIndex = colorOrder.indexOf(a);
    const bIndex = colorOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <span className={`color-identity ${className}`}>
      {sortedColors.map((color) => {
        const symbolUrl = getManaSymbolUrl(color);
        
        return (
          <span
            key={color}
            className={`color-symbol ${sizeClass} color-symbol-image`}
            title={color}
          >
            <img
              src={symbolUrl}
              alt={`{${color}}`}
              className="color-symbol-img"
              onError={(e) => {
                // Fallback: show text if image fails to load
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'inline';
                }
              }}
            />
            <span className="color-symbol-fallback" style={{ display: 'none' }}>
              {color}
            </span>
          </span>
        );
      })}
    </span>
  );
}

