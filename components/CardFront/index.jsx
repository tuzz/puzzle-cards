import { useState, useRef, useEffect } from "react";
import PuzzleCard from "../../public/PuzzleCard";
import VectorText from "../VectorText";
import types from "./types";
import stableRandom from "./stableRandom";
import randomDefects from "./defects";
import styles from "./styles.module.scss";

const CardFront = ({ card, random, defects, onLoaded = () => {} }) => {
  random = random || stableRandom(card);
  defects = defects || randomDefects(card, random);

  const editionText = card.editionIndex() < 2  ? "Standard Edition" : "Limited Edition";
  const tierText = `${card.tier} Tier`;

  const isMasterCopy = card.edition === "Master Copy";
  const isSigned = card.edition !== "Standard";
  const signatureSide = isSigned && random("signature-side")() < 0.5 ? "left" : "right";

  const TypeComponent = types[card.type];
  const clippingClass = defects.folded_corner && styles[`clip_${defects.folded_corner.corner}`];

  return (
    <div className={`${styles.card_front} ${styles[shinyMaterial(card)]} ${isMasterCopy && styles.master_copy}`}>
      <div className={`${styles.shiny_material} ${clippingClass}`}>
        {defects.peeling_foil && <div className={styles.peeling_foil} style={{ transform: `scaleX(${defects.peeling_foil})` }}></div>}

        <div className={styles.paper}>
          {defects.yellowing && <div className={styles.yellowing} style={{ transform: `scaleX(${defects.yellowing})` }}></div>}

          <VectorText className={styles.title} text={card.puzzle} />
        </div>

        <div className={styles.bottom_row}>
          <VectorText className={styles.edition} text={editionText} referenceText="Standard Edition" padSide="right" anchor="start" />

          <span className={styles.tier}>
            {tierIcons[card.tier].map(iconName => (
              <img key={iconName} src={`/images/${iconName}_icon.png`} className={`${styles.tier_icon} ${styles[iconName]}`} />
            ))}
            <VectorText className={`${styles.tier_name} ${styles[card.tier.toLowerCase()]}`} text={tierText} scale={tierScales[card.tier] || 1} anchor="end" />
          </span>
        </div>
      </div>

      <div className={styles.video}>
        <video autoPlay muted loop playsInline onCanPlay={onLoaded} style={{ transform: `rotate(${defects.puzzle_rotation}deg)` }}>
          <source src={card.puzzleVideoURL()} type="video/mp4" />
        </video>

        <div className={styles.overlay} style={{ transform: `rotate(${defects.puzzle_rotation}deg)` }}>
          {isMasterCopy && <div className={styles.master_copy_grid}>
            <VectorText className={styles.master_copy_text} text={"Master Copy"} />
          </div>}

          <VectorText className={styles.number} text={card.puzzleNumberInSet()} referenceText="123 / 123" padSide="left" />
        </div>
      </div>

      <div className={styles.type}>
        <TypeComponent card={card} random={random} />
      </div>

      {defects.fingerprint && <div className={`${styles.fingerprint} ${clippingClass}`}>
        <img src={`/images/fingerprint_${defects.fingerprint.image}.png`} style={{
          width: `${defects.fingerprint.width}%`,
          [defects.fingerprint.side]: `${defects.fingerprint.x}%`,
          top: `${defects.fingerprint.y}%`,
          opacity: defects.fingerprint.opacity,
          transform: `rotate(${defects.fingerprint.degrees}deg) scaleX(${defects.fingerprint.scaleX})`,
        }} />
      </div>}

      {defects.ink_stain && <div className={`${styles.ink_stain} ${clippingClass}`}>
        <img src={`/images/ink_stain_${defects.ink_stain.image}.png`} style={{
          width: `${defects.ink_stain.width}%`,
          left: `${defects.ink_stain.x}%`,
          top: `${defects.ink_stain.y}%`,
          opacity: defects.ink_stain.opacity,
          transform: `rotate(${defects.ink_stain.degrees}deg) scaleX(${defects.ink_stain.scaleX})`,
        }} />
      </div>}

      {defects.coffee_stain && <div className={`${styles.coffee_stain} ${clippingClass}`}>
        <img src={`/images/coffee_stain_${defects.coffee_stain.image}.png`} style={{
          width: `${defects.coffee_stain.width}%`,
          [defects.coffee_stain.side]: `${defects.coffee_stain.x}%`,
          top: `${defects.coffee_stain.y}%`,
          opacity: defects.coffee_stain.opacity,
          transform: `rotate(${defects.coffee_stain.degrees}deg) scaleX(${defects.coffee_stain.scaleX})`,
        }} />
      </div>}

      {isSigned && <img className={styles.signature} src={`/images/signature_${random("signature").mod(4) + 1}.png`} style={{
        height: `${random("signature-height")() * 4 + 13}%`,
        [signatureSide]: `${random("signature-x")() * 5 + 1.5}%`,
        top: `${random("signature-y")() * 25 + 50}%`,
        transform: `rotate(${random("signature-degrees")() * 25 * (signatureSide === "left" ? -1 : 1)}deg)`,
      }} />}

      {defects.folded_corner && <img className={styles.folded_corner} src="/images/folded_corner.png" style={{
        [defects.folded_corner.sideX]: 0,
        [defects.folded_corner.sideY]: 0,
        transform: `scaleX(${defects.folded_corner.scaleX}) scaleY(${defects.folded_corner.scaleY})`,
      }} />}
    </div>
  );
};

const shinyMaterial = (card) => {
  if (card.edition === "Limited" || card.edition === "Master Copy") {
    return "gold_glitter";
  } else if (card.tier === "Master") {
    return "silver_glitter";
  } else {
    return "silver_foil";
  }
};

// Manually set the size of the bottom-right tier text so that it matches the edition.
const tierScales = {
  Mortal: 0.6605568153,
  Immortal: 0.822058453,
  Ethereal: 0.7895565634,
  Virtual: 0.6839884102,
  Celestial: 0.7956034266,
  Godly: 0.6476929028,
  Master: 0.6792013102,
};

const tierIcons = {
  Mortal: [],
  Immortal: ["shield"],
  Ethereal: ["walls"],
  Virtual: ["glasses"],
  Celestial: ["helix"],
  Godly: ["shield", "walls", "glasses", "helix"],
  Master: [],
}

CardFront.stableRandom = stableRandom;
CardFront.randomDefects = randomDefects;

export default CardFront;
