import { useState, useRef, useEffect } from "react";
import VectorText from "../VectorText";
import styles from "./styles.module.scss";

let title = "Darkness Yields Light I";
//title = "Trial of Skill";

let videoSrc = "/test2.mp4";
//videoSrc = "/test.mp4";

let edition = "Standard Edition";
//edition = "Limited Edition";

let number = "125 / 188";
//number = "63 / 188";
//number = "7 / 188";

const CardFront = ({ onLoaded = () => {} }) => {

  return (
    <div className={styles.card_front}>
      <div className={styles.paper}>
        <VectorText className={styles.title} text={title} />

        <div className={styles.video}>
          <video autoPlay muted loop onCanPlay={onLoaded}>
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>

        <div className={styles.graphic}>
          <img src="/images/telescope.png" />
        </div>

        <div className={styles.horizontal_line}></div>

        <div className={styles.bottom_row}>
          <VectorText className={styles.edition} text={edition} referenceText="Standard Edition" padSide="right" />
          <VectorText className={styles.number} text={number} referenceText="123 / 123" padSide="left" />
        </div>
      </div>
    </div>
  );
};

export default CardFront;
