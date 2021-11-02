import { useContext, useRef, useState, useEffect } from "react";
import AppContext from "../AppRoot/context"
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import Dropdown from "./dropdown";
import styles from "./styles.module.scss";

const maxMintTier = 2; // TODO: restrict max mint tier per user address in the contract

const MintChip = ({ filters, onMoved = () => {}, channel }) => {
  const { PuzzleCard } = useContext(AppContext);
  const dropdowns = [{ ref: useRef() }, { ref: useRef() }];

  const [zoomed, setZoomed] = useState(false);
  const [numCards, setNumCards] = useState(1);
  const [tierName, setTierName] = useState("Mortal");

  channel.mintArgs = () => [numCards, tierName, PuzzleCard.ZERO_ADDRESS]; // Mint to the msg.sender.

  const zoomIn = () => {
    setZoomed(true);
    setTimeout(() => {
      addEventListener("mousedown", zoomOut);
      addEventListener("scroll", zoomOut);
    }, 0);
  };

  const zoomOut = (event) => {
    const path = event.path || (event.composedPath && event.composedPath());

    // Don't zoom out if the user clicked on one of the dropdowns.
    const dropdownIndex = dropdowns.findIndex(d => path.some(node => node === d.ref.current));
    if (dropdownIndex === 0) { dropdowns[1].setShowMenu(false); return; }
    if (dropdownIndex === 1) { dropdowns[0].setShowMenu(false); return; }

    // Don't zoom out if the user clicked on the chip while either dropdown was open.
    const isOpen = dropdowns.some(d => d.ref.current.children.length === 3);
    if (isOpen) { dropdowns.forEach(d => d.setShowMenu(false)); return; }

    removeEventListener("mousedown", zoomOut);
    removeEventListener("scroll", zoomOut);
    setZoomed(false);
  };

  const handleTierChange = (tierName, event) => {
    const tierIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === tierName);

    if (tierIndex > maxMintTier) {
      alert(`Promote a card to ${tierName} tier to unlock minting at that tier.`);
      event.stopPropagation();
    } else {
      setTierName(tierName);
    }
  }

  const handleStop = (event) => {
    if (!zoomed) {
      onMoved({ movedTo: event.target.getBoundingClientRect() });
    }
  };

  const rotation = { base: 0, random: 30, initial: -20 };

  const tierIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === tierName);
  const centsPerCard = PuzzleCard.DOLLAR_PRICE_PER_TIER[tierIndex] * 100;
  const priceInCents = Math.round(numCards * centsPerCard);
  const priceInDollars = priceInCents / 100;
  const displayPrice = priceInCents % 100 === 0 ? priceInDollars.toFixed(0) : priceInDollars.toFixed(2);

  return (
    <Draggable bounds="parent" zoomed={zoomed} onClick={zoomIn} disabled={zoomed} onStop={handleStop} className={styles.draggable}>
      <Zoomable zoomed={zoomed} rotateWhenZoomedOut={true} rotation={rotation} duration={1.5} minWidth={800} minHeight={800}>
        <Flippable flipped={zoomed} direction={Math.random() < 0.5 ? 1 : -1} delay={zoomed ? 0 : 0.5} className={styles.flippable}>
          <div className={styles.front}>
            <img src={`/images/poker_chip_black.png`} />
            <div className={`${styles.content} ${styles.dark_mode}`}>
              <span className={styles.mint}>Mint</span>
              <span className={styles.price}>${displayPrice}</span>
            </div>
          </div>

          <div className={styles.back}>
            <img src={`/images/poker_chip_white.png`} />
            <div className={styles.safari_blurry_text_fix}>
              <div className={styles.content}>
                <span className={styles.mint}>Mint</span>
                <span className={styles.price}>${displayPrice}</span>

                <Dropdown object={dropdowns[0]} className={styles.number_dropdown} value={numCards} onChange={setNumCards} options={[
                  { label: "1 card", value: 1 },
                  { label: "2 cards", value: 2 },
                  { label: "5 cards", value: 5 },
                  { label: "10 cards", value: 10 },
                  { label: "20 cards", value: 20 },
                  { label: "50 cards", value: 50 },
                  { label: "100 cards", value: 100 },
                  { label: "200 cards", value: 200 },
                  { label: "500 cards", value: 500 },
                ]} />

                <Dropdown object={dropdowns[1]} className={styles.tier_dropdown} value={tierName} onChange={handleTierChange} options={
                  PuzzleCard.TIER_NAMES.map((n, i) => ({ label: n, value: n, locked: i > maxMintTier }))
                } />
              </div>
            </div>
          </div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default MintChip;
