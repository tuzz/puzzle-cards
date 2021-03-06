import { useState, useRef, useEffect } from "react";
import styles from "./styles.module.scss";
let { default: Arrow, DIRECTION } = typeof window === "undefined" ? {} : require("react-arrows");

const ActionName = ({ name, transactState, showingFilters, channel, generation }) => {
  const [morph, setMorph] = useState({ from: "", to: "", ratio: 0, animate: null });

  const linkRef = useRef();
  const arrowRef = useRef();

  useEffect(() => {
    setMorph(previous => {
      const [numCards, tierName] = channel.mintArgs ? channel.mintArgs() : [];

      const displayText = !name ? "" :
        name === "mint" && numCards === 1 ? `mint1${tierName}Card` :
        name === "mint" ? `mint${numCards}${tierName}Cards` :
        name.includes("connect") ? "connectToMetaMask" :
        name;

      if (displayText === previous.to) {
        return previous;
      } else {
        return { from: previous.to, to: displayText, ratio: 0, animate: requestAnimationFrame(morphText) };
      }
    });
  }, [name, generation]);

  useEffect(() => {
    return () => cancelAnimationFrame(morph.animate);
  }, []);

  const morphText = (time) => {
    setMorph(previous => {
      const elapsed = time - (previous.time || time);

      const ratio = previous.ratio + elapsed / 500;
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

  const setArrowRef = () => {
    arrowRef.current = document.getElementsByClassName(styles.arrow)[0];
  }

  const stickGrounded = transactState.initial() || transactState.requesting() || transactState.allCancelled();

  setClass(arrowRef.current, styles.visible, morph.to && stickGrounded);
  setClass(arrowRef.current, styles.showing_filters, showingFilters);

  const anchor = name === "mint" ? "mintingCards" : name;
  const hrefProp = name && !name.includes("connect") && { href: `/how-to-play#${anchor}` };

  return (
    <div className={`${styles.action_name} ${morph.ratio > 0 && morph.ratio < 1 && styles.morphing}`}>
      <a style={style(1 - morph.ratio)}>{morph.from}</a>
      <a ref={linkRef} {...hrefProp} target="_blank" style={style(morph.ratio)}>{morph.to}</a>

      <svg style={{ pointerEvents: "none" }}>
        <defs>
          <filter id="threshold">
            <feColorMatrix in="SourceGraphic" type="matrix" values="0.8 0 0 0 0 0 0.8 0 0 0 0 0 0.8 0 0 0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>

    {Arrow && morph.to && <Arrow className={styles.arrow}
      from={{ direction: DIRECTION.TOP_LEFT, node: () => linkRef.current, translation: [-1, -0.4] }}
      to={{ direction: DIRECTION.LEFT, node: () => document.getElementById("metamask-button"), translation: [-0.6, 0] }}
      onChange={setArrowRef}
    />}
    </div>
  );
};

const setClass = (element, className, add) => {
  if (!element) { return; }
  const existing = element.getAttribute("class");

  if (add && !existing.includes(className)) {
    element.setAttribute("class", `${existing} ${className}`);
  } else if (!add) {
    element.setAttribute("class", existing.replaceAll(className, ""));
  }
}

export default ActionName;
