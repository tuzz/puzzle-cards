import Draggable from "../Draggable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const PlayingCard = ({ card }) => (
  <Draggable bounds="parent">
    <Flippable flipped={false} direction={-1} className={styles.flippable}>
      <iframe src={`/embed?${card && card.embedQueryString()}`} className={styles.iframe}>
        Your browser does not support iframes.
      </iframe>

      <div className={styles.back}>back</div>
    </Flippable>
  </Draggable>
);

export default PlayingCard;
