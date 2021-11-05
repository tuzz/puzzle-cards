const expect = require("chai").expect;
const { constants } = require("@openzeppelin/test-helpers");
const PuzzleCard = require("../public/PuzzleCard");
const TestUtils = require("./test_utils/TestUtils");

describe("Promotion", () => {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    PuzzleCard.setContract(contract);
  });

  it("can always promote via some combination of actions to the tier above", async () => {
    const numRuns = 50;
    const mintSize = 10;

    for (let i = 0; i < PuzzleCard.TIER_NAMES.length - 1; i += 1) {
      const tier = PuzzleCard.TIER_NAMES[i];
      console.log(`\nTesting promotion from ${tier} tier:`);

      const results = [];
      const actionsTaken = []
      const lastConditions = [];
      let leftovers = [];

      for (let j = 0; j < numRuns; j += 1) {
        const deck = { tier, actionsTaken, lastConditions };
        PuzzleCard.TYPE_NAMES.forEach(t => deck[t] = []);

        let numMinted = 0;

        while (!deck.promotionAction) {
          const mintedCards = await PuzzleCard.gift(mintSize, tier, owner.address);
          numMinted += mintSize;

          for (let card of mintedCards) {
            deck[card.type].push(card);
          }

          while (await tryToPromote(deck)) {}
          //if (printDeckSoICanManuallyCheckNoMoreActionsCanBePerformed(deck, 200)) { return; }
        }

        const totalPrice = numMinted * PuzzleCard.DOLLAR_PRICE_PER_TIER[i];
        console.log(`  - ${numMinted} minted cards: $${totalPrice.toFixed(2)}     (${deck.promotionAction})`);

        results.push([numMinted, totalPrice]);
        PuzzleCard.TYPE_NAMES.forEach(t => leftovers = leftovers.concat(deck[t]));
      }

      const avgNum = results.map(([n, _]) => n).reduce((a, b) => a + b) / results.length;
      const avgPrice = results.map(([_, p]) => p).reduce((a, b) => a + b) / results.length;

      console.log(`On average it takes ${avgNum} cards and costs $${avgPrice.toFixed(2)} (upper bound).`);

      console.log("\nActions taken:")
      const actionFrequencies = TestUtils.tallyFrequencies(actionsTaken);
      for (let [actionName, frequency] of Object.entries(actionFrequencies).sort(([, a], [, b]) => b - a)) {
        console.log(`  - ${actionName} ${(frequency * 100).toFixed(2)}%`);
      }

      console.log("\nCondition of promoted card:")
      const conditionFrequencies = TestUtils.tallyFrequencies(lastConditions);
      const conditions = PuzzleCard.CONDITION_NAMES;

      for (let i = PuzzleCard.CONDITION_NAMES.length - 1; i >= 0; i -= 1) {
        console.log(`  - ${conditions[i]} ${((conditionFrequencies[conditions[i]] || 0) * 100).toFixed(2)}%`);
      }

      console.log("\nLeftover cards:");
      const leftoverFrequencies = TestUtils.tallyFrequencies(leftovers.map(c => c.type));
      for (let [type, frequency] of Object.entries(leftoverFrequencies).sort(([, a], [, b]) => b - a)) {
        console.log(`  - ${type} ${(frequency * 100).toFixed(2)}%`);
      }
    }
  });
});

// I'm not 100% confident in the functions below so this is so I can check we're
// genuinely stuck and need to mint a new card to progress further.
const printDeckSoICanManuallyCheckNoMoreActionsCanBePerformed = (deck, printAtSize) => {
  if (deck.promotionAction) { return false; }

  let size = 0;
  PuzzleCard.TYPE_NAMES.forEach(t => size += deck[t].length);

  if (size < printAtSize) { return false; }

  PuzzleCard.TYPE_NAMES.forEach(t => {
    console.log(`${t} cards:`);

    if (deck.tier === "Master") {
      console.log(deck[t].map(c => [c.color1, c.series, c.puzzle, c.condition]));
    } else {
      console.log(deck[t].map(c => [c.color1, c.color2, c.variant]));
    }
  });

  console.log("cards in deck:", size);

  return true;
};

// These functions work a bit like a recursive descent parser. They first start
// by trying to apply the rules closest to promoting a card, then work backwards
// to generate cards that are needed to perform those actions. It's probably
// quite similar to how a human would play the game. The 'discard2Pickup1'
// action isn't called which could mean a human can promote with fewer cards.

const tryToPromote = (deck, allPristine) => (
  // Promotion in one step:
  goThroughStarDoor(deck) ||
  teleportToNextArea(deck) ||
  puzzleMastery2(deck, allPristine) ||

  // Promotion in two steps:
  jumpIntoEclipse(deck) ||
  shineTorchOnBasePair(deck) ||
  puzzleMastery1(deck, allPristine) ||

  // Promotion in three steps:
  lookThroughTelescope(deck) ||

  // Promotion in <= four steps:
  lookThroughGlasses(deck)
);

const goThroughStarDoor = (deck) => (
  combine(deck["Player"], anyCard, player => (
    combine(deck["Door"], d => d.variant === "Open", openDoor => (
      perform("goThroughStarDoor", [player, openDoor], deck)
    ))
  ))
);

const teleportToNextArea = (deck) => (
  combine(deck["Player"], anyCard, player => (
    combine(deck["Teleport"], anyCard, teleport => (
      combine(deck["Map"], anyCard, map => (
        perform("teleportToNextArea", [player, teleport, map], deck)
      ))
    ))
  ))
);

const puzzleMastery2 = (deck, allPristine) => (
  combine(deck["Star"], s => s.color1 === "Red"    && (!allPristine || s.condition === "Pristine"), red => (
  combine(deck["Star"], s => s.color1 === "Green"  && (!allPristine || s.condition === "Pristine"), green => (
  combine(deck["Star"], s => s.color1 === "Yellow" && (!allPristine || s.condition === "Pristine"), yellow => (
  combine(deck["Star"], s => s.color1 === "Blue"   && (!allPristine || s.condition === "Pristine"), blue => (
  combine(deck["Star"], s => s.color1 === "Pink"   && (!allPristine || s.condition === "Pristine"), pink => (
  combine(deck["Star"], s => s.color1 === "White"  && (!allPristine || s.condition === "Pristine"), white => (
  combine(deck["Star"], s => s.color1 === "Black"  && (!allPristine || s.condition === "Pristine"), black => (

  perform("puzzleMastery2", [red, green, yellow, blue, pink, white, black], deck)

  ))))))))))))))
);

const jumpIntoEclipse = (deck) => (
  combine(deck["Player"], anyCard, player => (
    combine(deck["Eclipse"], anyCard, eclipse => (
      combine(deck["Door"], d => d.variant === "Closed", closedDoor => (
        perform("jumpIntoEclipse", [player, eclipse, closedDoor], deck)
      ))
    ))
  ))
);

const shineTorchOnBasePair = (deck) => (
  combine(deck["Helix"], allCards, helix => (
    combine(deck["Torch"], t => t.color1 === helix.color1 && t.color2 === helix.color2, torch => (
      combine(deck["Player"], anyCard, player => (
        perform("shineTorchOnBasePair", [helix, torch, player], deck)
      ))
    ))
  )) ||
  deck["Helix"].find(helix => (
    helix.color1 === helix.color2 && jumpIntoBeacon(deck, helix.color1)
  )) ||
  deck["Helix"].find(helix => (
    helix.color1 !== helix.color2 && swapLensColor(deck, helix.color1, helix.color2)
  )) ||
  deck["Helix"].find(helix => (
    helix.color1 !== helix.color2 && (
      changeLensColor(deck, helix.color1, helix.color2) ||
      changeLensColor(deck, helix.color2, helix.color1)
    )
  ))
);

const puzzleMastery1 = (deck, allPristine) => (
  combine(deck["Artwork"], a => a.edition === "Standard" && (!allPristine || a.condition === "Pristine"), artwork1 => (
    combine(deck["Artwork"], a => a.edition === "Standard" && (!allPristine || a.condition === "Pristine") && a.series === artwork1.series && a.puzzle === artwork1.puzzle, artwork2 => (
      perform("puzzleMastery1", [artwork1, artwork2], deck)
    ))
  ))
);

const lookThroughTelescope = (deck) => (
  combine(deck["Telescope"], allCards, telescope => (
    combine(deck["Active"], a => a.color1 === telescope.color1 && a.variant === telescope.variant, active => (
      combine(deck["Player"], anyCard, player => (
        perform("lookThroughTelescope", [telescope, player, active], deck)
      ))
    )) || activateSunOrMoon(deck, telescope.color1, telescope.variant)
  ))
);

const lookThroughGlasses = (deck) => (
  combine(deck["Hidden"], anyCard, hidden => (
    combine(deck["Glasses"], anyCard, glasses => (
      combine(deck["Player"], anyCard, player => (
        perform("lookThroughGlasses", [hidden, glasses, player], deck)
      ))
    ))
  ))
);

// These actions are called situationally depending on what's needed to progress.

const activateSunOrMoon = (deck, color, variant) => (
  combine(deck["Inactive"], i => i.color1 === color && i.variant === variant, inactive => (
    matchingActivator(deck, inactive.color1, activator => (
      perform("activateSunOrMoon", [inactive, activator], deck)
    ))
  ))
);

const matchingActivator = (deck, color, callback) => {
  const inaccessible = deck.tier === "Ethereal" || deck.tier === "Godly";

  return (
    combine(deck["Cloak"], c => c.color1 === color, callback) ||
    !inaccessible && (
      combine(deck["Crab"], anyCard, callback) ||
      combine(deck["Player"], anyCard, callback)
    )
  );
};

const jumpIntoBeacon = (deck, color) => (
  combine(deck["Torch"], allCards, torch => (
    combine(deck["Beacon"], b => b.color1 === color, beacon => (
      combine(deck["Player"], anyCard, player => (
        perform("jumpIntoBeacon", [torch, beacon, player], deck)
      ))
    ))
  ))
);

const swapLensColor = (deck, color1, color2) => (
  combine(deck["Torch"], t => t.color2 === color1 && t.color1 === color2, torch => (
    combine(deck["Inactive"], i => i.color1 === color1 || i.color1 === color2, inactive => (
      matchingActivator(deck, inactive.color1, activator => (
        perform("changeLensColor", [torch, inactive, activator], deck)
      ))
    ))
  ))
);

const changeLensColor = (deck, existingTorchColor, colorToActivate) => (
  combine(deck["Torch"], t => t.color1 === existingTorchColor || t.color2 === existingTorchColor, torch => (
    combine(deck["Inactive"], i => i.color1 === colorToActivate, inactive => (
      matchingActivator(deck, inactive.color1, activator => (
        perform("changeLensColor", [torch, inactive, activator], deck)
      ))
    ))
  ))
);

const anyCard = (_, i, length) => i === length - 1;
const allCards = () => true;

const combine = (cardsForType, filter, callback) => {
  for (let i = cardsForType.length - 1; i >= 0; i -= 1) {
    const card = cardsForType[i];
    if (!filter(card, i, cardsForType.length)) { continue; }

    const removedCard = cardsForType.splice(i, 1)[0]; // side effect
    const result = callback(removedCard);

    if (result) { return result; }
    cardsForType.push(removedCard);
  }

  return false;
};

const perform = async (actionName, cards, deck) => {
  if (deck.promotionAction) { return true; } // Short circuit if we've already promoted.

  let mintedCards

  try {
    mintedCards = await PuzzleCard[actionName](cards);
  } catch { // TODO: move this (pre/post?) mechanism into PuzzleCard
    const titleized = actionName[0].toUpperCase() + actionName.slice(1);
    const [_, reasons] = await PuzzleCard[`can${titleized}`](cards);

    throw new Error([actionName, cards, reasons]);
  }

  if (mintedCards[0].tier !== deck.tier) {
    deck.promotionAction = actionName;
    deck.lastConditions.push(mintedCards[0].condition);
  }

  deck.actionsTaken.push(actionName);
  mintedCards.forEach(c => deck[c.type].push(c));

  return mintedCards;
};
