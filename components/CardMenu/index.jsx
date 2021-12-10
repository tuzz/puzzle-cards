import OpenSeaLogo from "./open_sea_logo.svg";
import styles from "./styles.module.scss";

const CardMenu = ({ menuRef, cardStack, visible }) => (
  <div ref={menuRef} className={`${styles.card_menu} ${visible && styles.visible}`}>
    <span className={styles.condition}>Condition: {cardStack.card.condition}</span>

    <a href={cardStack.card.openSeaURL()} target="_blank" className={styles.opensea_link}>
      <span>View your card on</span>
      <OpenSeaLogo className={styles.open_sea_logo} textBaseLine={3} />
    </a>

    <span className={styles.copies_owned}>Copies owned: {cardStack.quantity}</span>
  </div>
);

export default CardMenu;
