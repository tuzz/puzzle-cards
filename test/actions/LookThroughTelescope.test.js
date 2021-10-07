const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("LookThroughTelescope", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const telescopeCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Telescope", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent" };
  const activeCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Active", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent" };

  itBehavesLikeAnAction("lookThroughTelescope", [playerCard, telescopeCard, activeCard], [["Player"], ["Telescope"], ["Active"]], "Mortal");

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

    it("cannot be performed if a sun is used on a telescope with a moon", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...telescopeCard, variant: "Moon" }, owner.address);
      await contract.mintExactByNames({ ...activeCard, variant: "Sun" }, owner.address);

      const [isAllowed, reasons] = await contract.canLookThroughTelescope([1, 2, 3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card does not match the telescope]", reasons);
    });

    it("cannot be performed if a moon is used on a telescope with a sun", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...telescopeCard, variant: "Sun" }, owner.address);
      await contract.mintExactByNames({ ...activeCard, variant: "Moon" }, owner.address);

      const [isAllowed, reasons] = await contract.canLookThroughTelescope([1, 2, 3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card does not match the telescope]", reasons);
    });

    it("cannot be performed if the sun or moon's color does not match the telescope", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...telescopeCard, color1: "Red" }, owner.address);
      await contract.mintExactByNames({ ...activeCard, color1: "Blue" }, owner.address);

      const [isAllowed, reasons] = await contract.canLookThroughTelescope([1, 2, 3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card does not match the telescope]", reasons);
    });

    it("mints either a Helix, Torch or Beacon card with equal probability", async () => {
      const typeNames = [];

      for (let i = 0; i < 100; i += 1) {
        await contract.mintExactByNames(playerCard, owner.address);
        await contract.mintExactByNames(telescopeCard, owner.address);
        await contract.mintExactByNames(activeCard, owner.address);

        const batchOffset = i * 4;
        const batchTokenIDs = [1, 2, 3].map(t => t + batchOffset);

        await contract.lookThroughTelescope(batchTokenIDs);
        const mintedTokenID = batchOffset + 4;

        const type = await contract.typeName(mintedTokenID);
        const color1 = await contract.color1Name(mintedTokenID);
        const color2 = await contract.color2Name(mintedTokenID);
        const variant = await contract.variantName(mintedTokenID);

        expect(["Helix", "Torch", "Beacon"]).to.include(type);
        expect(TestUtils.isRealColor(color1)).to.equal(true);
        expect(variant).to.equal("None");

        if (type === "Helix") {
          expect(TestUtils.isRealColor(color2)).to.equal(true);
        } else if (type === "Torch") {
          expect(TestUtils.isRealColor(color2)).to.equal(true);
        } else if (type === "Beacon") {
          expect(TestUtils.isRealColor(color2)).to.equal(false);
        }

        typeNames.push(type);
      }

      const frequencies = TestUtils.tallyFrequencies(typeNames)

      expect(frequencies["Helix"]).to.be.within(0.233, 0.433);  // 33.3%
      expect(frequencies["Torch"]).to.be.within(0.233, 0.433);  // 33.3%
      expect(frequencies["Beacon"]).to.be.within(0.233, 0.433); // 33.3%
    });
  });
});
