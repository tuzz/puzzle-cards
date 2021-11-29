import { useContext, useState, useEffect } from "react";
import DeckContext from "../DeckLoader/context"
import styles from "./styles.module.scss";

const Pagination = ({ filters, setFilters }) => {
  const { address, decks } = useContext(DeckContext);
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    setShowing(bool => bool || address && decks[address].length > 6);
  }, [address, decks]);

  if (!showing) { return null; }

  return (
    <div className={styles.pagination}>
      <button disabled={!filters.hasPrevPage()} onClick={() => setFilters(f => f.prevPage())} className={`${styles.tick_mark} ${styles.prev_page}`}></button>
      <button disabled={!filters.hasNextPage()} onClick={() => setFilters(f => f.nextPage())} className={`${styles.tick_mark} ${styles.next_page}`}></button>
    </div>
  );
};

export default Pagination;
