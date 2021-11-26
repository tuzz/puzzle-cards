const randomDefects = (card, random) => {
  const { always, sometimes, num } = possibleDefects[card.condition];
  return { ...always, ...choose(random, num, sometimes) };
};

const possibleDefects = {
  Pristine: {
    always: {},
    sometimes: [],
    num: 0,
  },
  Excellent: {
    always: { peeling_foil: true },
    sometimes: [],
    num: 0
  },
  Reasonable: {
    always: { peeling_foil: true },
    sometimes: ["smudged_title", "yellowing", "faint_fingerprint"],
    num: 1
  },
  Poor: {
    always: { peeling_foil: true },
    sometimes: ["smudged_title", "yellowing", "tilted_puzzle", "folded_corner", "obvious_fingerprint"],
    num: 2
  },
  Dire: {
    always: { peeling_foil: true, yellowing: true },
    sometimes: ["smudged_title", "slipped_puzzle", "coffee_stain", "torn_edge", "folded_corner", "obvious_fingerprint"],
    num: 2
  },
};

const choose = (random, num, sometimes) => {
  const chosen = {};
  let attempt = 0;

  for (let i = 0; i < num; i += 1) {
    while (true) {
      const index = random(`card-defect-${attempt}`).mod(sometimes.length);
      const defect = sometimes[index];

      attempt += 1;

      if (!chosen[defect]) {
        chosen[defect] = true;
        break;
      }
    }
  }

  return chosen;
};

export default randomDefects;
