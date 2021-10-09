const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("Discard2Pickup1", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const doorCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Door", color1: "None", color2: "None", variant: "Open", condition: "Excellent", edition: "Standard" };

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
      TestUtils.addHelpfulMethodsTo(contract);
    });

    it("cannot be performed if the same card is used twice", async () => {
      await contract.mintExactByNames(playerCard, owner.address);

      const [isAllowed, reasons] = await contract.canDiscard2Pickup1([1, 1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the same card was used twice]", reasons);
    });

    it("inherits the tier and condition from the discarded cards", async () => {
      const tierConditionPairs = [];

      for (let i = 0; i < 200; i += 1) {
        await contract.mintExactByNames({ ...playerCard, tier: "Immortal", condition: "Pristine" }, owner.address);
        await contract.mintExactByNames({ ...doorCard, tier: "Master", condition: "Dire" }, owner.address);

        const batchSize = 3;
        const batchOffset = i * batchSize;
        const batchTokenIDs = [1, 2].map(t => t + batchOffset);

        await contract.discard2Pickup1(batchTokenIDs);
        const mintedTokenID = batchOffset + batchSize;

        const tier = await contract.tierName(mintedTokenID);
        const condition = await contract.conditionName(mintedTokenID);

        tierConditionPairs.push([tier, condition]);
      }

      const frequencies = TestUtils.tallyFrequencies(tierConditionPairs);

      expect(frequencies[["Master", "Pristine"]]).to.be.below(0.2);           // 10%
      expect(frequencies[["Immortal", "Pristine"]]).to.be.within(0.35, 0.55); // 45%
      expect(frequencies[["Master", "Dire"]]).to.be.within(0.35, 0.55);       // 45%
    });
  });
});
