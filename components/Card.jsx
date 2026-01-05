import React from 'react';
import ManaCost from './ManaCost';
import OracleText from './OracleText';
import { getCardImage, getCardManaCost, getCardTypeLine, getCardOracleText, getCardPower, getCardToughness, getCardLoyalty } from '../utils/cardUtils';

export default function Card({ card, onAddToDeck, showAddButton = false, onSetCommander = null, hasCommander = false }) {
  if (!card) return null;

  const imageUrl = getCardImage(card);
  const manaCost = getCardManaCost(card);
  const typeLine = getCardTypeLine(card);
  const oracleText = getCardOracleText(card);
  const power = getCardPower(card);
  const toughness = getCardToughness(card);
  const rarity = card.rarity || 'common';
  const setName = card.set_name || '';
  
  // Check if card is a creature
  const isCreature = typeLine && typeLine.toLowerCase().includes('creature');
  
  // Check if card is a planeswalker
  const isPlaneswalker = typeLine && typeLine.toLowerCase().includes('planeswalker');
  const loyalty = getCardLoyalty(card);
  
  // Get card prices (prefer EUR, fallback to USD, exclude TIX unless it's the only option)
  const prices = card.prices || {};
  const realCurrencyPrice = prices.eur || prices.eur_foil || prices.usd || prices.usd_foil || null;
  const tixPrice = prices.tix || null;
  const isEur = prices.eur || prices.eur_foil;
  const isTix = !realCurrencyPrice && tixPrice;
  const price = realCurrencyPrice || tixPrice;
  const priceDisplay = price ? (
    isTix ? (
      <span className="card-price-tix">{parseFloat(price).toFixed(2)} TIX</span>
    ) : (
      isEur ? `€${parseFloat(price).toFixed(2)}` : `$${parseFloat(price).toFixed(2)}`
    )
  ) : null;

  return (
    <div className="card">
      <div className="card-image-container">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={card.name} 
            className="card-image"
            loading="lazy"
          />
        ) : (
          <div className="card-image-placeholder">
            <span>No Image</span>
          </div>
        )}
        <div className="card-action-buttons">
          {showAddButton && (
            <button 
              className="card-add-button"
              onClick={() => onAddToDeck && onAddToDeck(card)}
              title="Add to deck"
            >
              +
            </button>
          )}
          {onSetCommander && !hasCommander && (
            <button 
              className="card-commander-button"
              onClick={() => onSetCommander && onSetCommander(card)}
              title="Set as commander"
            >
              ⭐
            </button>
          )}
        </div>
      </div>
      <div className="card-info">
        <div className="card-header">
          <h3 className="card-name">{card.name}</h3>
          <ManaCost manaCost={manaCost} className="card-mana-cost" />
        </div>
        <div className="card-type">{typeLine}</div>
        {oracleText && (
          <OracleText text={oracleText} className="card-text" />
        )}
        {isPlaneswalker && loyalty !== null && loyalty !== undefined && (
          <div className="card-loyalty">Loyalty: {loyalty}</div>
        )}
        {isCreature && power !== null && toughness !== null && (
          <div className="card-pt">{power}/{toughness}</div>
        )}
        <div className="card-footer">
          <span className={`card-rarity rarity-${rarity}`}>{rarity}</span>
          <div className="card-footer-right">
            {priceDisplay && (isTix ? priceDisplay : <span className="card-price">{priceDisplay}</span>)}
            {setName && <span className="card-set">{setName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

