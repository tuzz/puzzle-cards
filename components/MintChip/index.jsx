import { useContext, useRef, useState, useEffect } from "react";
import AppContext from "../AppRoot/context"
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import Dropdown from "./dropdown";
import styles from "./styles.module.scss";

const MintChip = ({ filters, onMoved = () => {}, channel }) => {
  const { PuzzleCard, address, chainId, maxTiers, updateMaxTier } = useContext(AppContext);
  const maxTier = maxTiers[address];

  const dropdowns = [{ ref: useRef() }, { ref: useRef() }];
  const chipRef = useRef();

  const [zoomed, setZoomed] = useState(false);
  const [numCards, setNumCards] = useState(1);
  const [tierName, setTierName] = useState("Mortal");
  const [prevPair, setPrevPair] = useState([]);
  const [unlockState, setUnlockState] = useState("initial");

  useEffect(() => {
    if (!address || !chainId || !maxTier) { return; }

    if (address === prevPair[0] && chainId === prevPair[1]) {
      if (unlockState === "pending") {
        setTimeout(() => alert(`Success! You can now mint at all tiers, including Master tier.`), 100);
      } else {
        alert(`Congratulations, you have successfully promoted a card to ${maxTier} tier and can now mint at that tier.`);
      }
    } else if (isLocked(tierName)) {
      setTierName(maxTier);
    }

    setPrevPair([address, chainId]);
  }, [address, chainId, maxTiers]);

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

  const isLocked = (tierName) => {
    const tierIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === tierName);
    const maxIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === maxTier)

    return tierIndex !== 0 && tierIndex > maxIndex;
  };

  const handleTierChange = async (tierName, event) => {
    if (tierName === "unlock") {
      event.stopPropagation();

      if (unlockState === "initial" && confirmUnlock()) {
        if (typeof ethereum === "undefined") {
          alert("Please install the MetaMask browser extension then try again.");
          return;
        }

        setUnlockState("pending");
        await PuzzleCard.unlockMintingAtAllTiers().then(() => updateMaxTier(address, chainId)).catch(() => {});
        setUnlockState("initial");
      }

      return;
    }

    if (isLocked(tierName)) {
      alert(`Promote a card to ${tierName} tier to unlock minting at that tier.`);
      event.stopPropagation();
    } else {
      setTierName(tierName);
    }
  }

  const confirmUnlock = () => {
    const price = PuzzleCard.BASE_PRICE_IN_DOLLARS * PuzzleCard.UNLOCK_PRICE_MULTIPLIER;
    return confirm(`Do you want to pay $${price} to unlock minting at all tiers?`);
  };

  const handleStop = (event) => {
    if (!zoomed) {
      onMoved({ movedTo: chipRef.current.getBoundingClientRect() });
    }
  };

  const rotation = { base: 0, random: 30, initial: -20 };

  const tierIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === tierName);
  const centsPerCard = PuzzleCard.BASE_PRICE_IN_DOLLARS * 100 * PuzzleCard.MINT_PRICE_MULTIPLERS[tierIndex];
  const priceInCents = Math.round(numCards * centsPerCard);
  const priceInDollars = priceInCents / 100;
  const displayPrice = priceInCents % 100 === 0 ? priceInDollars.toFixed(0) : priceInDollars.toFixed(2);

  const highestTier = maxTier === PuzzleCard.TIER_NAMES[PuzzleCard.TIER_NAMES.length - 1];
  const tierClasses = [styles.tier_dropdown, !highestTier && styles.unlockable, unlockState !== "initial" && styles.unlocking].filter(s => s).join(" ");

  return (
    <Draggable nodeRef={chipRef} bounds="parent" zoomed={zoomed} zoomDuration={1.5} onClick={zoomIn} disabled={zoomed} onStop={handleStop} className={styles.draggable}>
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

                <Dropdown object={dropdowns[1]} className={tierClasses} value={tierName} onChange={handleTierChange} options={[
                  ...PuzzleCard.TIER_NAMES.map(n => ({ label: n, value: n, locked: isLocked(n) })),
                  highestTier ? null : { label: unlockState === "initial" ? "Unlock all" : "Pending...", value: "unlock" },
                ].filter(o => o)} />
              </div>
            </div>
          </div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default MintChip;
