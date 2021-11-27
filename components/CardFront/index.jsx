import { useState, useRef, useEffect } from "react";
import seedrandom from "seedrandom";
import PuzzleCard from "../../public/PuzzleCard";
import VectorText from "../VectorText";
import types from "./types";
import randomDefects from "./defects";
import styles from "./styles.module.scss";

const CardFront = ({ card, onLoaded = () => {} }) => {
  const random = stableRandom(card);
  const edition = `${card.edition} Edition`;
  const tier = `${card.tier} Tier`;
  const TypeComponent = types[card.type];
  const defects = randomDefects(card, random);

  return (
    <div className={styles.card_front}>
      {defects.peeling_foil && <div className={styles.peeling_foil} style={{ transform: `scaleX(${defects.peeling_foil})` }}></div>}

      <div className={styles.paper}>
        {defects.yellowing && <div className={styles.yellowing} style={{ transform: `scaleX(${defects.yellowing})` }}></div>}

        <VectorText className={styles.title} text={card.puzzleTitle()} />

        <div className={styles.video}>
          <video autoPlay muted loop playsInline onCanPlay={onLoaded}>
            <source src={card.puzzlePreviewUrl()} type="video/mp4" />
          </video>

          <div className={styles.overlay}>
            <VectorText className={styles.number} text={card.puzzleNumberInSet()} referenceText="123 / 123" padSide="left" />
          </div>
        </div>

        <div className={styles.type}>
          <TypeComponent card={card} random={random} />
        </div>
      </div>

      <div className={styles.bottom_row}>
        <VectorText className={styles.edition} text={edition} referenceText="Standard Edition" padSide="right" anchor="start" />
        <span className={styles.tier}>
          {tierIcons[card.tier].map(iconName => (
            <img key={iconName} src={`/images/${iconName}_icon.png`} className={`${styles.tier_icon} ${styles[iconName]}`} />
          ))}
          <VectorText className={`${styles.tier_name} ${styles[card.tier.toLowerCase()]}`} text={tier} scale={tierScales[card.tier] || 1} anchor="end" />
        </span>
      </div>
    </div>
  );
};

const stableRandom = (card) => {
  const tokenID = card.tokenID().toString();

  return (seed) => {
    const generator = seedrandom(tokenID + seed);
    generator.mod = (n) => Math.abs(generator.int32()) % n;

    return generator;
  };
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

export default CardFront;
