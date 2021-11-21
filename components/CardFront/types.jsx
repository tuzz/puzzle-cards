import VectorText from "../VectorText";
import styles from "./styles.module.scss";

module.exports.Player = ({ card }) => {
  const name = snakeCase(card.variant);

  return (
    <div className={`${styles.player} ${styles[name]}`}>
      <img src={`/images/types/${name}.png`} />
    </div>
  );
};

module.exports.Crab = ({ card }) => {
  const className = `crab_${snakeCase(card.variant)}`;
  const basename = className.replace("swim_", "").replace("floating", "middle");

  return (
    <div className={`${styles.crab} ${styles[className]}`}>
      <img src={`/images/types/${basename}.png`} />
    </div>
  );
};

module.exports.Cloak = ({ card }) => (
  <p>cloak</p>
);

module.exports.Inactive = ({ card }) => {
  const name = snakeCase([card.color1, card.variant]);

  return (
    <div className={`${styles.inactive} ${styles[name]}`}>
      <img src={`/images/types/${name}.png`} />
    </div>
  );
};

module.exports.Active = ({ card }) => {
  const name = snakeCase([card.color1, card.variant]);

  return (
    <div className={`${styles.inactive} ${styles[name]}`}>
      <img src={`/images/types/${name}.png`} />
    </div>
  );
};

module.exports.Telescope = ({ card, random }) => {
  const mirrored = random("mirror-telescope").mod(2) === 0;
  const sunOrMoon = snakeCase([card.color1, card.variant]);

  return (
    <div className={`${styles.telescope} ${mirrored && styles.mirrored}`}>
      <img src="/images/types/telescope.png" className={styles.body} />
      <img src={`/images/types/${sunOrMoon}.png`} className={styles.lock} />
    </div>
  );
};

module.exports.Helix = ({ card, random }) => {
  const image = random("alternate-helix").mod(2) === 0 ? "1" : "2";
  const mirrored = random("mirror-helix").mod(2) === 0;

  return (
    <div className={`${styles.helix} ${mirrored && styles.mirrored}`}>
      <img src={`/images/types/helix${image}.png`} />

      <div className={`${styles.left_sensor} ${card.color1.toLowerCase()}`}>
        <VectorText text={card.color1} />
      </div>

      <div className={`${styles.right_sensor} ${card.color2.toLowerCase()}`}>
        <VectorText text={card.color2} />
      </div>
    </div>
  );
};

module.exports.Beacon = ({ card }) => (
  <p>beacon</p>
);

module.exports.Torch = ({ card }) => (
  <p>torch</p>
);

const arrowColors = ["red", "green", "blue", "yellow", "pink", "white"]; // Skip black
const blurColors = ["red", "green", "blue", "yellow", "pink", "black"]; // Skip white

module.exports.Map = ({ card, random }) => {
  const withLocation = card.variant.includes("Location");
  const withDate = card.variant.includes("Date");
  const withTime = card.variant.includes("Time");

  return (
    <div className={`${styles.map} ${styles[name]}`}>
      <img src="/images/types/map.png" />

      {withLocation && <img
        src={`/images/types/${arrowColors[random("map-arrow-color").mod(6)]}_arrow.png`}
        className={styles.arrow}
        style={{
          left: `${40 + random("map-arrow-left")() * 20}%`,
          top: `${43 + random("map-arrow-top")() * 14}%`,
          transform: `rotate(${random("map-arrow-degrees")() * 360}deg)`,
        }}
      />}

      {withDate && <>
          <img className={styles.blur_1} src={`/images/types/${blurColors[random("blur-1").mod(6)]}_blur.png`} />
          <img className={styles.blur_2} src={`/images/types/${blurColors[random("blur-2").mod(6)]}_blur.png`} />
          <img className={styles.blur_3} src={`/images/types/${blurColors[random("blur-3").mod(6)]}_blur.png`} />
          <img className={styles.blur_4} src={`/images/types/${blurColors[random("blur-4").mod(6)]}_blur.png`} />
          <img className={styles.blur_5} src={`/images/types/${blurColors[random("blur-5").mod(6)]}_blur.png`} />
          <img className={styles.blur_6} src={`/images/types/${blurColors[random("blur-6").mod(6)]}_blur.png`} />
          <img className={styles.blur_7} src={`/images/types/${blurColors[random("blur-7").mod(6)]}_blur.png`} />
      </>}

      {withTime && <img
        src="/images/types/clock.png"
        className={styles.clock}
        style={{ animationDelay: `${random("map-clock-time")() * -100000}s` }}
      />}
    </div>
  );
};

module.exports.Teleport = ({ card }) => (
  <p>teleport</p>
);

module.exports.Glasses = ({ card }) => (
  <p>glasses</p>
);

module.exports.Eclipse = ({ card }) => (
  <p>eclipse</p>
);

module.exports.Door = ({ card }) => (
  <p>door</p>
);

module.exports.Hidden = ({ card }) => (
  <p>hidden</p>
);

module.exports.Star = ({ card }) => (
  <p>star</p>
);

module.exports.Artwork = ({ card }) => (
  <p>artwork</p>
);

const snakeCase = (strings) => {
  strings = Array.isArray(strings) ? strings : [strings];
  return strings.join("_").toLowerCase().replaceAll(" ", "_");
};
