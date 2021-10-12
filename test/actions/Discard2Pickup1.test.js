const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../contracts/PuzzleCard");

describe("Discard2Pickup1", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const doorCard = new PuzzleCard({ ...baseCard, type: "Door", variant: "Open" });

  const anyType = ["Player", "Crab", "Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Door", "Hidden", "Star", "Artwork"];

  itBehavesLikeAnAction("discard2Pickup1", [playerCard, doorCard], [anyType, anyType], "Mortal", { skipSameTierTest: true, skipDegradeTest: true });
  itMintsATierStarterCard("discard2Pickup1", [playerCard, doorCard], false);

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

    it("can be performed if two copies of the same card are used", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);
      await PuzzleCard.mintExact(playerCard, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canDiscard2Pickup1([playerCard, playerCard]);

      expect(isAllowed).to.equal(true);
    });

    it("cannot be performed if the same card is used twice (double spent)", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canDiscard2Pickup1([playerCard, playerCard]);

      expect(isAllowed).to.equal(false);
    });

    it("inherits the tier and condition from the discarded cards", async () => {
      const tierConditionPairs = [];

      for (let i = 0; i < 200; i += 1) {
        const card1 = await PuzzleCard.mintExact(new PuzzleCard({ ...playerCard, tier: "Immortal", condition: "Pristine" }), owner.address);
        const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...doorCard, tier: "Master", condition: "Dire" }), owner.address);

        const mintedCard = await PuzzleCard.discard2Pickup1([card1, card2]);

        tierConditionPairs.push([mintedCard.tier, mintedCard.condition]);
      }

      const frequencies = TestUtils.tallyFrequencies(tierConditionPairs);

      expect(frequencies[["Master", "Pristine"]]).to.be.below(0.2);           // 10%
      expect(frequencies[["Immortal", "Pristine"]]).to.be.within(0.35, 0.55); // 45%
      expect(frequencies[["Master", "Dire"]]).to.be.within(0.35, 0.55);       // 45%
    });
  });
});
