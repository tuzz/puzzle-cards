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
  const basename = className.replace("swim_", "point_").replace("floating", "standing");

  const showGlasses = card.tier === "Virtual" || card.tier === "Godly";

  return (
    <div className={`${styles.crab} ${styles[className]}`}>
      <img src={`/images/types/${basename}.png`} />

      {showGlasses && <div className={styles.crab_sunglasses}>
        <img src="/images/types/black_lens.png" className={styles.left_lens} />
        <img src="/images/types/black_lens.png" className={styles.right_lens} />
        <img src="/images/types/sunglasses_frame.png" className={styles.frame} />
      </div>}
    </div>
  );
};

module.exports.Cloak = ({ card, random }) => {
  const text = `${card.color1} Cloak`;
  const animationDelay = random("cloak-animation-delay")() * -20;
  const videoDelay = random("cloak-video-delay")() * 5.5;

  return (
    <div className={`${styles.cloak} ${styles[card.color1.toLowerCase()]}`}>
      <video autoPlay muted loop playsInline style={{ animationDelay: `${animationDelay}s` }}>
        <source src={`/videos/${card.color1.toLowerCase()}_cloak.mov#t=${videoDelay}`} type="video/mp4" />
        <source src={`/videos/${card.color1.toLowerCase()}_cloak.webm#t=${videoDelay}`} type="video/webm" />
      </video>
      <VectorText className={styles.text} text={text} referenceText="Yellow Cloak" padSide="around" />
    </div>
  );
};

module.exports.Inactive = ({ card }) => {
  const name = snakeCase([card.color1, card.variant]);
  const text = `Inactive ${card.color1} ${card.variant}`;
  const inaccessible = card.tier === "Ethereal" || card.tier === "Godly";

  return (
    <div className={`${styles.inactive} ${styles[card.color1.toLowerCase()]}`}>
      <VectorText className={`${styles.text} ${inaccessible && styles.raised}`} text={text} referenceText="Inactive Yellow Moon" padSide="around" />
      <img src={`/images/types/inactive_${name}.png`} />

      {inaccessible && <>
        <div className={styles.left_wall}></div>
        <div className={styles.right_wall}></div>
        <div className={styles.top_wall}></div>

        <img className={styles.left_cross} src="/images/cross_mark.png" />
        <img className={styles.right_cross} src="/images/cross_mark.png" />

        <VectorText className={styles.left_text} text="Player" />
        <VectorText className={styles.right_text} text="Crab" />
      </>}
    </div>
  );
};

module.exports.Active = ({ card }) => {
  const name = snakeCase([card.color1, card.variant]);
  const text = `Active ${card.color1} ${card.variant}`;
  const inaccessible = card.tier === "Ethereal" || card.tier === "Godly";

  return (
    <div className={`${styles.active} ${styles[card.color1.toLowerCase()]}`}>
      <VectorText className={styles.text} text={text} referenceText="Inactive Yellow Moon" padSide="around" />
      <img src={`/images/types/active_${name}.png`} />

      {inaccessible && <>
        <div className={styles.left_wall}></div>
        <div className={styles.right_wall}></div>
        <div className={styles.top_wall}></div>
      </>}
    </div>
  );
};

module.exports.Telescope = ({ card, random }) => {
  const mirrored = random("mirror-telescope").mod(2) === 0;
  const sunOrMoon = snakeCase([card.color1, card.variant]);
  const text = `${card.color1} ${card.variant}`;

  return (
    <div className={`${styles.telescope} ${mirrored && styles.mirrored} ${styles[card.color1.toLowerCase()]}`}>
      <img src="/images/types/telescope.png" className={styles.body} />
      <img src="/images/types/telescope_particles.png" className={styles.particles} />
      <img src={`/images/types/${sunOrMoon}.png`} className={styles.lock} />
      <VectorText className={styles.text} text={text} referenceText="Yellow Moon" padSide="around" />
    </div>
  );
};

module.exports.Helix = ({ card, random }) => {
  const image = random("alternate-helix").mod(2) === 0 ? "1" : "2";
  const mirrored = random("mirror-helix").mod(2) === 0;

  return (
    <div className={`${styles.helix} ${mirrored && styles.mirrored}`}>
      <VectorText className={`${styles.left_text} ${card.color1.toLowerCase()}`} text={card.color1} referenceText="Yellow" padSide="right" />
      <VectorText className={`${styles.right_text} ${card.color2.toLowerCase()}`} text={card.color2} referenceText="Yellow" padSide="left" />
      <img src={`/images/types/helix${image}.png`} />
      <div className={`${styles.left_sensor} ${card.color1.toLowerCase()}`}></div>
      <div className={`${styles.right_sensor} ${card.color2.toLowerCase()}`}></div>
    </div>
  );
};

module.exports.Beacon = ({ card, random }) => {
  const clockwise = random("beacon-clockwise").mod(2) === 0;
  const [from, to] = clockwise ? [0, 360] : [360, 0];

  const gradient1Id = `${card.color1}-gradient1`;
  const gradient2Id = `${card.color1}-gradient2`;

  return (
    <div className={`${styles.beacon} ${styles[card.color1.toLowerCase()]}`}>
      <VectorText className={styles.text} text={`${card.color1} Beacon`} referenceText="Yellow Beacon" padSide="around" />

      <svg className={styles.triangles} viewBox="0 0 698.41 400.19">
        <defs>
          <linearGradient id={gradient1Id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={styles[card.color1.toLowerCase()]} />
            <stop offset="100%" className={styles[card.color1.toLowerCase()]} stopOpacity="0%" />
          </linearGradient>

          <linearGradient id={gradient2Id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={styles[card.color1.toLowerCase()]} stopOpacity="0%" />
            <stop offset="100%" className={styles[card.color1.toLowerCase()]} />
          </linearGradient>
        </defs>

        <g transform="translate(349.205,200.095)">
          <polygon points="-1,0 500,-200 500,200" fill={`url(#${gradient1Id})`} />
          <polygon points="1,0 -500,-200 -500,200" fill={`url(#${gradient2Id})`} />
          <animateTransform attributeName="transform" type="rotate" from={from} to={to} dur="4s" additive="sum" repeatCount="indefinite" />
        </g>
      </svg>
    </div>
  );
};

module.exports.Torch = ({ card }) => {
  const gradientId = `${card.color1}-${card.color2}-gradient`;

  return (
    <div className={styles.torch}>
      <VectorText className={`${styles.left_text} ${card.color1.toLowerCase()}`} text={card.color1} referenceText="Yellow" padSide="left" />
      <VectorText className={`${styles.right_text} ${card.color2.toLowerCase()}`} text={card.color2} referenceText="Yellow" padSide="right" />

      <svg className={styles.beam} viewBox="0 0 12 21">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={styles[card.color1.toLowerCase()]} />
            <stop offset="35%" className={styles[card.color1.toLowerCase()]} />
            <stop offset="65%" className={styles[card.color2.toLowerCase()]} />
            <stop offset="100%" className={styles[card.color2.toLowerCase()]} />
          </linearGradient>
        </defs>

        <path d="M0,0 L12,0 L8,20 L4,20z" fill={`url(#${gradientId})`} />
      </svg>

      <svg className={styles.base} viewBox="0 0 12 21">
        <ellipse cx="6" cy="20" rx="2" ry="0.4" style={{ fill: "white" }} />
      </svg>
    </div>
  );
};

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
  <div className={styles.teleport}>
    <video autoPlay muted loop playsInline>
      <source src="/videos/teleport.mov" type="video/mp4" />
      <source src="/videos/teleport.webm" type="video/webm" />
    </video>
  </div>
);

module.exports.Glasses = ({ card }) => (
  <div className={styles.glasses}>
    <img className={styles.left_lens} src={`/images/types/${card.color1.toLowerCase()}_lens.png`} />
    <img className={styles.right_lens} src={`/images/types/${card.color2.toLowerCase()}_lens.png`} />
    <img className={styles.frame} src="/images/types/sunglasses_frame.png" />
    <VectorText className={`${styles.left_text} ${card.color1.toLowerCase()}`} text={card.color1} referenceText="Yellow" padSide="around" />
    <VectorText className={`${styles.right_text} ${card.color2.toLowerCase()}`} text={card.color2} referenceText="Yellow" padSide="around" />
  </div>
);

module.exports.Eclipse = ({ card }) => (
  <div className={styles.eclipse}>
    <img className={styles.particles} src="/images/types/eclipse_particles.png" />
    <img className={styles.sprite} src="/images/types/eclipse.png" />
  </div>
);

module.exports.Door = ({ card }) => {
  const name = snakeCase(card.variant);

  return (
    <div className={`${styles.door} ${name}`}>
      <img src={`/images/types/door_${name}.png`} />
    </div>
  );
};

module.exports.Hidden = ({ card }) => (
  <div className={styles.hidden}>
    <VectorText text="(Hidden)" />
  </div>
);

module.exports.Star = ({ card }) => {
  const color = card.color1.toLowerCase();
  const quickly = card.condition === "Pristine";

  return (
    <div className={styles.star}>
      <img className={quickly && styles.spin_quickly} src={`/images/types/${color}_star.png`} />
      <VectorText text={card.color1} referenceText="Yellow" padSide="around" />
    </div>
  );
};

module.exports.Artwork = ({ card, random }) => {
  const name = snakeCase(card.variant);
  const mirrored = !nonMirroredArt.includes(name) && random("mirror-artwork").mod(2) === 0;

  return (
    <div className={`${styles.artwork} ${styles[name]}`}>
      <img src={`/images/artwork/${name}.png`} className={`${mirrored && styles.mirrored}`} />
    </div>
  );
};

const nonMirroredArt = [
  "book_cover",
  "sun_padlock",
  "frozen_sun",
  "frozen_moon",
  "black_hourglass",
  "white_hourglass",
  "torch_coral",
];

const snakeCase = (strings) => {
  strings = Array.isArray(strings) ? strings : [strings];
  return strings.join("_").toLowerCase().replaceAll(" ", "_");
};
