const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("LookThroughGlasses", () => {
  const playerCard = new PuzzleCard({ ...baseCard, tier: "Virtual", type: "Player" });
  const glassesCard = new PuzzleCard({ ...baseCard, tier: "Virtual", type: "Glasses", color1: "Red", color2: "Green" });
  const hiddenCard = new PuzzleCard({ ...baseCard, tier: "Virtual", type: "Hidden" });

  itBehavesLikeAnAction("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], [["Player"], ["Glasses"], ["Hidden"]], "Virtual");

  describe("action specific behaviour", () => {
    let factory, contract, owner, user1;

    before(async () => {
      factory = await ethers.getContractFactory("TestUtils");
      [owner, user1] = await ethers.getSigners();
    });

    beforeEach(async () => {
      contract = await factory.deploy(constants.ZERO_ADDRESS);
      PuzzleCard.setContract(contract);
    });

    it("mints using slightly friendlier type probabilities (no player cards, almost no crab cards)", async () => {
      const typeNames = [];

      for (let i = 0; i < 10000; i += 1) {
        const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
        const card2 = await PuzzleCard.mintExact(glassesCard, owner.address);
        const card3 = await PuzzleCard.mintExact(hiddenCard, owner.address);

        const mintedCard = (await PuzzleCard.lookThroughGlasses([card1, card2, card3]))[0];

        typeNames.push(mintedCard.type);
      }

      const frequencies = TestUtils.tallyFrequencies(typeNames);

      // It seems unfair to produce a player or glasses card seeing as those
      // cards were combined as part of the action. Also make it so crab cards
      // are almost non-existent because it's already difficult to get through
      // this tier and this should make it easier.

      const m = 1000 / 591; // The probabilities no longer add up to 100%.

      expect(frequencies["Player"]).to.be.undefined;                     // 0%
      expect(frequencies["Glasses"]).to.be.undefined;                    // 0%
      expect(frequencies["Crab"]).to.be.below(0.1 * m);                  // 0.1%

      // Use the standard type probabilities for everything else (adjusted by m).
      expect(frequencies["Inactive"]).to.be.within(0.15 * m, 0.25 * m);  // 20%
      expect(frequencies["Active"]).to.be.within(0.05 * m, 0.15 * m);    // 10%
      expect(frequencies["Cloak"]).to.be.within(0.05 * m, 0.15 * m);     // 10%
      expect(frequencies["Telescope"]).to.be.within(0.05 * m, 0.15 * m); // 10%
      // ...
    });
  });
});
