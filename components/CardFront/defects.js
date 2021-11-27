const randomDefects = (card, random) => {
  const { always, sometimes, num } = possibleDefects[card.condition];
  const defects = { ...always, ...choose(random, num, sometimes) };

  if (defects.peeling_foil) {
    defects.peeling_foil = random("peeling-foil-scale-x").mod(2) * 2 - 1;
  }

  if (defects.yellowing) {
    defects.yellowing = random("yellowing-scale-x").mod(2) * 2 - 1;
  }

  if (defects.tilted_puzzle) {
    defects.puzzle_rotation = random("puzzle-degrees").mod(2) * 3 - 1.5;
  } else if (defects.slipped_puzzle) {
    defects.puzzle_rotation = random("puzzle-degrees").mod(2) * 8 - 4;
  } else {
    defects.puzzle_rotation = 0;
  }

  if (defects.faint_fingerprint || defects.obvious_fingerprint) {
    defects.fingerprint = {};
    defects.fingerprint.image = random("fingerprint-image").mod(2) + 1;
    defects.fingerprint.width = random("fingerprint-width")() * 5 + 15;
    defects.fingerprint.side = random("fingerprint-side").mod(2) === 0 ? "left" : "right";
    defects.fingerprint.x = random("fingerprint-x")() * 10;
    defects.fingerprint.y = random("fingerprint-y")() * 50 + 40;
    defects.fingerprint.opacity = random("fingerprint-opacity")() * 0.05 + 0.1;
    defects.fingerprint.degrees = random("fingerprint-degrees")() * 60 - 30;
    defects.fingerprint.scaleX = random("fingerprint-scale-x").mod(2) * 2 - 1;

    if (defects.faint_fingerprint) { defects.fingerprint.opacity /= 2; }
  }

  if (defects.coffee_stain) {
    defects.coffee_stain = {};
    defects.coffee_stain.image = random("coffee-stain-image").mod(6) + 1;
    defects.coffee_stain.width = random("coffee-stain-width")() * 20 + 90;
    defects.coffee_stain.side = random("coffee-stain-side").mod(2) === 0 ? "left" : "right";
    defects.coffee_stain.x = random("coffee-stain-x")() * 20 + 60;
    defects.coffee_stain.y = random("coffee-stain-y")() * 130 - 50;
    defects.coffee_stain.opacity = random("coffee-stain-opacity")() * 0.4 + 0.2;
    defects.coffee_stain.degrees = random("coffee-stain-degrees")() * 360;
    defects.coffee_stain.scaleX = random("coffee-stain-scale-x").mod(2) * 2 - 1;
  }

  if (defects.folded_corner) {
    defects.folded_corner = corners[random("folded-corner").mod(4)];
  }

  return defects;
};

const corners = ["top_left", "top_right", "bottom_left", "bottom_right"];

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
