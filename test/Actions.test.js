const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("Actions", () => {
  const playerCard     = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const crabCard       = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Crab", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const inactiveCard   = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Inactive", color1: "Red", color2: "None", variant: "Sun", condition: "Excellent", edition: "Standard" };
  const activeCard     = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Active", color1: "Red", color2: "None", variant: "Sun", condition: "Excellent", edition: "Standard" };
  const cloakCard      = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Cloak", color1: "Red", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const telescopeCard  = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Telescope", color1: "Red", color2: "None", variant: "Sun", condition: "Excellent", edition: "Standard" };
  const helixCard      = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Helix", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const torchCard      = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Torch", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const beaconCard     = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Beacon", color1: "Green", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const mapCard        = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Map", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const teleportCard   = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Teleport", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const glassesCard    = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Glasses", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const eclipseCard    = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Eclipse", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const openDoorCard   = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Door", color1: "None", color2: "None", variant: "Open", condition: "Excellent", edition: "Standard" };
  const closedDoorCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Door", color1: "None", color2: "None", variant: "Closed", condition: "Excellent", edition: "Standard" };
  const hiddenCard     = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Hidden", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard       = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Star", color1: "Red", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const artworkCard    = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Artwork", color1: "None", color2: "None", variant: "Art1", condition: "Excellent", edition: "Standard" };

  const allCards = [playerCard, crabCard, inactiveCard, activeCard, cloakCard, telescopeCard, helixCard, torchCard, beaconCard, mapCard, teleportCard, glassesCard, eclipseCard, openDoorCard, closedDoorCard, hiddenCard, starCard, artworkCard];

  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    TestUtils.addHelpfulMethodsTo(contract);
  });

  it("can get a list of all actions that can be taken for a given card combination", async () => {
    const cardCombinations = {};

    // Find all actions that can be taken with two-card combinations.
    for (let i = 0; i < allCards.length; i += 1) {
      for (let j = i; j < allCards.length; j += 1) {
        const tokenID1 = await tokenID(contract.mintExactByNames(allCards[i], owner.address));
        const tokenID2 = await tokenID(contract.mintExactByNames(allCards[j], owner.address));

        const actionNames = await contract.actionsThatCanBeTaken([tokenID1, tokenID2]);

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
          const tokenID1 = await tokenID(contract.mintExactByNames(allCards[i], owner.address));
          const tokenID2 = await tokenID(contract.mintExactByNames(allCards[j], owner.address));
          const tokenID3 = await tokenID(contract.mintExactByNames(allCards[k], owner.address));

          const actionNames = await contract.actionsThatCanBeTaken([tokenID1, tokenID2, tokenID3]);

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

    const tokenIDs = await TestUtils.tokenIDs(colors, color1 => (
      contract.mintExactByNames({ ...starCard, color1 }, owner.address)
    ));

    const actionNames = await contract.actionsThatCanBeTaken(tokenIDs);

    expect(actionNames.filter(s => s !== "")).to.deep.equal(["puzzleMastery2"]);
  });
});
