const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const { tokenID, baseCard } = TestUtils;
const PuzzleCard = require("../public/PuzzleCard");

describe("Actions", () => {
  const playerCard     = new PuzzleCard({ ...baseCard, type: "Player", variant: "Dive" });
  const crabCard       = new PuzzleCard({ ...baseCard, type: "Crab", variant: "Middle" });
  const inactiveCard   = new PuzzleCard({ ...baseCard, type: "Inactive", color1: "Red", variant: "Sun" });
  const activeCard     = new PuzzleCard({ ...baseCard, type: "Active", color1: "Red", variant: "Sun" });
  const cloakCard      = new PuzzleCard({ ...baseCard, type: "Cloak", color1: "Red" });
  const telescopeCard  = new PuzzleCard({ ...baseCard, type: "Telescope", color1: "Red", variant: "Sun" });
  const helixCard      = new PuzzleCard({ ...baseCard, type: "Helix", color1: "Red", color2: "Green" });
  const torchCard      = new PuzzleCard({ ...baseCard, type: "Torch", color1: "Red", color2: "Green" });
  const beaconCard     = new PuzzleCard({ ...baseCard, type: "Beacon", color1: "Green" });
  const mapCard        = new PuzzleCard({ ...baseCard, type: "Map", variant: "Plain" });
  const teleportCard   = new PuzzleCard({ ...baseCard, type: "Teleport" });
  const glassesCard    = new PuzzleCard({ ...baseCard, type: "Glasses", color1: "Red", color2: "Green" });
  const eclipseCard    = new PuzzleCard({ ...baseCard, type: "Eclipse" });
  const openDoorCard   = new PuzzleCard({ ...baseCard, type: "Door", variant: "Open" });
  const closedDoorCard = new PuzzleCard({ ...baseCard, type: "Door", variant: "Closed" });
  const hiddenCard     = new PuzzleCard({ ...baseCard, type: "Hidden" });
  const starCard       = new PuzzleCard({ ...baseCard, type: "Star", color1: "Red" });
  const artworkCard    = new PuzzleCard({ ...baseCard, type: "Artwork", variant: "Art 1" });

  const allCards = [playerCard, crabCard, inactiveCard, activeCard, cloakCard, telescopeCard, helixCard, torchCard, beaconCard, mapCard, teleportCard, glassesCard, eclipseCard, openDoorCard, closedDoorCard, hiddenCard, starCard, artworkCard];

  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    PuzzleCard.setContract(contract);
  });

  it("can get a list of all actions that can be taken for a given card combination", async () => {
    const cardCombinations = {};

    // Find all actions that can be taken with two-card combinations.
    for (let i = 0; i < allCards.length; i += 1) {
      for (let j = i; j < allCards.length; j += 1) {
        await PuzzleCard.mintExact(allCards[i], owner.address);
        await PuzzleCard.mintExact(allCards[j], owner.address);

        const actionNames = await PuzzleCard.actionsThatCanBeTaken([allCards[i], allCards[j]]);

        for (const actionName of actionNames) {
          if (actionName === "") { continue; }

          cardCombinations[actionName] = cardCombinations[actionName] || [];
          cardCombinations[actionName].push([allCards[i].type, allCards[j].type].sort());
        }
      }
    }

    // Find all actions that can be taken with three-card combinations.
    for (let i = 0; i < allCards.length; i += 1) {
      for (let j = i; j < allCards.length; j += 1) {
        for (let k = j; k < allCards.length; k += 1) {
          await PuzzleCard.mintExact(allCards[i], owner.address);
          await PuzzleCard.mintExact(allCards[j], owner.address);
          await PuzzleCard.mintExact(allCards[k], owner.address);

          const actionNames = await PuzzleCard.actionsThatCanBeTaken([allCards[i], allCards[j], allCards[k]]);

          for (const actionName of actionNames) {
            if (actionName === "") { continue; }

            cardCombinations[actionName] = cardCombinations[actionName] || [];
            cardCombinations[actionName].push([allCards[i].type, allCards[j].type, allCards[k].type].sort());
          }
        }
      }
    }

    expect(cardCombinations["activateSunOrMoon"]).to.deep.equal([
      ["Inactive", "Player"],
      ["Crab", "Inactive"],
      ["Cloak", "Inactive"],
    ]);

    expect(cardCombinations["lookThroughTelescope"]).to.deep.equal([
      ["Active", "Player", "Telescope"],
    ]);

    expect(cardCombinations["changeLensColor"]).to.deep.equal([
      ["Inactive", "Player", "Torch"],
      ["Glasses", "Inactive", "Player"],
      ["Crab", "Inactive", "Torch"],
      ["Crab", "Glasses", "Inactive"],
      ["Cloak", "Inactive", "Torch"],
      ["Cloak", "Glasses", "Inactive"],
    ]);

    expect(cardCombinations["jumpIntoBeacon"]).to.deep.equal([
      ["Beacon", "Player", "Torch"],
      ["Beacon", "Glasses", "Player"],
    ]);

    expect(cardCombinations["shineTorchOnBasePair"]).to.deep.equal([
      ["Helix", "Player", "Torch"],
    ]);

    expect(cardCombinations["teleportToNextArea"]).to.deep.equal([
      ["Map", "Player", "Teleport"],
    ]);

    expect(cardCombinations["jumpIntoEclipse"]).to.deep.equal([
      ["Door", "Eclipse", "Player"],
    ]);

    expect(cardCombinations["goThroughStarDoor"]).to.deep.equal([
      ["Door", "Player"],
    ]);

    expect(cardCombinations["lookThroughGlasses"]).to.deep.equal([
      ["Glasses", "Hidden", "Player"],
    ]);

    expect(cardCombinations["puzzleMastery1"]).to.deep.equal([
      ["Artwork", "Artwork"],
    ]);

    expect(cardCombinations["discard2Pickup1"].length).to.above(150);

    expect(Object.keys(cardCombinations).length).to.equal(11);

    const colors = ["Red", "Green", "Blue", "Yellow", "Pink", "White", "Black"];
    const starCards = colors.map(color1 => new PuzzleCard({ ...starCard, color1 }));

    for (const card of starCards) {
      await PuzzleCard.mintExact(card, owner.address);
    }

    const actionNames = await PuzzleCard.actionsThatCanBeTaken(starCards);

    expect(actionNames.filter(s => s !== "")).to.deep.equal(["puzzleMastery2"]);
  });
});
