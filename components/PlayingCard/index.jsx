import Draggable from "react-draggable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const PlayingCard = ({ card }) => (
  <Draggable bounds="parent">
    <div style={{ display: "inline-block" }}>
      <Flippable flipped={false} direction={-1} className={styles.flippable}>
        <iframe src={`/embed?${card && card.embedQueryString()}`} className={styles.iframe}>
          Your browser does not support iframes.
        </iframe>

        <div className={styles.back}>back</div>
      </Flippable>
    </div>
  </Draggable>
);

export default PlayingCard;
