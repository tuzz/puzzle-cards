import styles from "./styles.module.scss";

module.exports.Player = ({ card }) => {
  const v = snakeCase(card.variant);

  return (
    <div className={`${styles.player} ${styles[v]}`}>
      <img src={`/images/types/${v}.png`} />
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

module.exports.Inactive = ({ card }) => (
  <p>inactive</p>
);

module.exports.Active = ({ card }) => (
  <p>active</p>
);

module.exports.Telescope = ({ card }) => (
  <p>telescope</p>
);

module.exports.Helix = ({ card }) => (
  <p>helix</p>
);

module.exports.Beacon = ({ card }) => (
  <p>beacon</p>
);

module.exports.Torch = ({ card }) => (
  <p>torch</p>
);

module.exports.Map = ({ card }) => (
  <p>map</p>
);

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
