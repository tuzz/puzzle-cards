import styles from "./styles.module.scss";

const Pagination = ({ filters, setFilters }) => {
  if (filters.deck.length <= 6) { return null; }

  return (
    <div className={styles.pagination}>
      <button disabled={!filters.hasPrevPage()} onClick={() => setFilters(f => f.prevPage())} className={`${styles.tick_mark} ${styles.prev_page}`}></button>
      <button disabled={!filters.hasNextPage()} onClick={() => setFilters(f => f.nextPage())} className={`${styles.tick_mark} ${styles.next_page}`}></button>
    </div>
  );
};

export default Pagination;
