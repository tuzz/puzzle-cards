import { useState, useRef, useEffect } from "react";
import PuzzleCard from "../../public/PuzzleCard";
import VectorText from "../VectorText";
import styles from "./styles.module.scss";

const CardFront = ({ card, onLoaded = () => {} }) => {
  const edition = `${card.edition} Edition`;

  return (
    <div className={styles.card_front}>
      <div className={styles.paper}>
        <VectorText className={styles.title} text={card.puzzleTitle()} />

        <div className={styles.video}>
          <video autoPlay muted loop onCanPlay={onLoaded}>
            <source src={card.puzzlePreviewUrl()} type="video/mp4" />
          </video>
        </div>

        <div className={styles.graphic}>
          <img src="/images/telescope.png" />
        </div>
      </div>

      <div className={styles.bottom_row}>
        <VectorText className={styles.edition} text={edition} referenceText="Standard Edition" padSide="right" />
        <VectorText className={styles.number} text={card.puzzleNumberInSet()} referenceText="123 / 123" padSide="left" />
      </div>
  </div>
  );
};

export default CardFront;
