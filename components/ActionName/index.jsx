import { useState, useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const ActionName = ({ name }) => {
  const [morph, setMorph] = useState({ from: "", to: "", ratio: 0, animate: null });

  useEffect(() => {
    setMorph(previous => {
      if (name === previous.to) {
        return previous;
      } else {
        const ratio = previous.to ? 0 : 0.7;
        return { from: previous.to, to: name, ratio, animate: requestAnimationFrame(morphText) };
      }
    });
  }, [name]);

  useEffect(() => {
    return () => cancelAnimationFrame(morph.animate);
  }, []);

  const morphText = (time) => {
    setMorph(previous => {
      const elapsed = time - (previous.time || time);
      const duration = previous.to ? 500 : 250;

      const ratio = previous.ratio + elapsed / duration;
      const animate = ratio < 1 ? requestAnimationFrame(morphText) : null;

      return { ...previous, ratio, animate, time };
    });
  };

  const style = (ratio) => {
    if (ratio <= 0) {
      return { filter: "", opacity: 0 };
    } else if (ratio >= 1) {
      return { filter: "", opacity: 1 };
    } else {
      return {
        filter: `blur(${Math.min(2 / ratio - 2, 10)}px)`,
        opacity: `${Math.pow(ratio, 0.1) * 100}%`,
      };
    }
  }

  return (
    <div className={`${styles.action_name} ${morph.ratio > 0 && morph.ratio < 1 && styles.morphing}`}>
      <a style={style(1 - morph.ratio)}>{morph.from}</a>
      <a href={`/recipes#${morph.to}`} target="_blank" style={style(morph.ratio)}>{morph.to}</a>

      <svg style={{ display: "none" }}>
        <defs>
          <filter id="threshold">
            <feColorMatrix in="SourceGraphic" type="matrix" values="0.8 0 0 0 0 0 0.8 0 0 0 0 0 0.8 0 0 0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default ActionName;
