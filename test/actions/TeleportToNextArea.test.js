const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("TeleportToNextArea", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const teleportCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Teleport", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const mapCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Map", color1: "None", color2: "None", variant: "None", condition: "Excellent" };

  itBehavesLikeAnAction("teleportToNextArea", [playerCard, teleportCard, mapCard], [["Player"], ["Teleport"], ["Map"]], "Immortal");

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

    it("mints a random card for the tier above", async () => {
      const typeNames = [];

      for (let i = 0; i < 500; i += 1) {
        await contract.mintExactByNames(playerCard, owner.address);
        await contract.mintExactByNames(teleportCard, owner.address);
        await contract.mintExactByNames(mapCard, owner.address);

        const batchOffset = i * 4;
        const batchTokenIDs = [1, 2, 3].map(t => t + batchOffset);

        await contract.teleportToNextArea(batchTokenIDs);
        const mintedTokenID = batchOffset + 4;

        const tier = await contract.tierName(mintedTokenID);
        const type = await contract.typeName(mintedTokenID);

        expect(tier).to.equal("Immortal");
        typeNames.push(type);
      }

      const frequencies = TestUtils.tallyFrequencies(typeNames)

      expect(frequencies["Player"]).to.be.within(0.15, 0.25);    // 20%
      expect(frequencies["Crab"]).to.be.within(0.15, 0.25);      // 20%
      expect(frequencies["Inactive"]).to.be.within(0.15, 0.25);  // 20%
      expect(frequencies["Active"]).to.be.within(0.05, 0.15);    // 10%
      expect(frequencies["Cloak"]).to.be.within(0.05, 0.15);     // 10%
      expect(frequencies["Telescope"]).to.be.within(0.05, 0.15); // 10%
      // ...
    }).timeout(60000);

    const tiers1 = ["Mortal", "Immortal", "Ethereal"];
    const tiers2 = ["Celestial", "Godly", "Master"];

    for (const [before, nonDegrading, after] of [tiers1, tiers2]) {
      it(`can still degrade when promoting from ${before} tier to ${nonDegrading} tier`, async () => {
        const conditionNames = new Set();

        for (let i = 0; i < 20; i += 1) {
          await contract.mintExactByNames({ ...playerCard, tier: before }, owner.address);
          await contract.mintExactByNames({ ...teleportCard, tier: before }, owner.address);
          await contract.mintExactByNames({ ...mapCard, tier: before }, owner.address);

          const batchOffset = i * 4;
          const batchTokenIDs = [1, 2, 3].map(t => t + batchOffset);

          await contract.teleportToNextArea(batchTokenIDs);
          const mintedTokenID = batchOffset + 4;

          const condition = await contract.conditionName(mintedTokenID)
          conditionNames.add(condition);
        }

        expect(conditionNames.size).to.equal(2);
      });

      it(`cannot degrade when promoting from ${nonDegrading} tier to ${after} tier`, async () => {
        const tierNames = new Set();

        for (let i = 0; i < 20; i += 1) {
          await contract.mintExactByNames({ ...playerCard, tier: nonDegrading }, owner.address);
          await contract.mintExactByNames({ ...teleportCard, tier: nonDegrading }, owner.address);
          await contract.mintExactByNames({ ...mapCard, tier: nonDegrading }, owner.address);

          const batchOffset = i * 4;
          const batchTokenIDs = [1, 2, 3].map(t => t + batchOffset);

          await contract.teleportToNextArea(batchTokenIDs);
          const mintedTokenID = batchOffset + 4;

          const condition = await contract.conditionName(mintedTokenID)
          expect(condition).to.equal("Excellent");
        }
      });
    }

    // TODO: glasses/hidden
  });
});
