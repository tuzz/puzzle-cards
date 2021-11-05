const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("LookThroughTelescope", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const telescopeCard = new PuzzleCard({ ...baseCard, type: "Telescope", color1: "Black", variant: "Sun" });
  const activeCard = new PuzzleCard({ ...baseCard, type: "Active", color1: "Black", variant: "Sun" });

  itBehavesLikeAnAction("lookThroughTelescope", [playerCard, telescopeCard, activeCard], [["Player"], ["Telescope"], ["Active"]], "Mortal");

  describe("action specific behaviour", () => {
    let factory, contract, owner, user1;

    before(async () => {
      factory = await ethers.getContractFactory("TestUtils");
      [owner, user1] = await ethers.getSigners();
    });

    beforeEach(async () => {
      contract = await factory.deploy(constants.ZERO_ADDRESS);
      PuzzleCard.setContract(contract);
      TestUtils.readArrays();
    });

    it("cannot be performed if a sun is used on a telescope with a moon", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...telescopeCard, variant: "Moon" }), owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...activeCard, variant: "Sun" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canLookThroughTelescope([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card doesn't match the telescope]", reasons);
    });

    it("cannot be performed if a moon is used on a telescope with a sun", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...telescopeCard, variant: "Sun" }), owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...activeCard, variant: "Moon" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canLookThroughTelescope([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card doesn't match the telescope]", reasons);
    });

    it("cannot be performed if the sun or moon's color doesn't match the telescope", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...telescopeCard, color1: "Red" }), owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...activeCard, color1: "Blue" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canLookThroughTelescope([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card doesn't match the telescope]", reasons);
    });

    it("mints either a Helix, Torch or Beacon card with equal probability", async () => {
      const typeNames = [];
      const colorMatches = [];

      for (let i = 0; i < 1000; i += 1) {
        const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
        const card2 = await PuzzleCard.mintExact(telescopeCard, owner.address);
        const card3 = await PuzzleCard.mintExact(activeCard, owner.address);

        const mintedCard = (await PuzzleCard.lookThroughTelescope([card1, card2, card3]))[0];
        const type = mintedCard.type;

        expect(["Helix", "Torch", "Beacon"]).to.include(type);
        expect(TestUtils.isRealColor(mintedCard.color1)).to.equal(true);
        expect(mintedCard.variant).to.equal("None");

        if (type === "Helix") {
          expect(TestUtils.isRealColor(mintedCard.color2)).to.equal(true);
        } else if (type === "Torch") {
          expect(TestUtils.isRealColor(mintedCard.color2)).to.equal(true);
        } else if (type === "Beacon") {
          expect(TestUtils.isRealColor(mintedCard.color2)).to.equal(false);
        }

        typeNames.push(type);
        colorMatches.push([type, mintedCard.color1 == mintedCard.color2]);
      }

      const typeFrequencies = TestUtils.tallyFrequencies(typeNames)
      const matchFrequencies = TestUtils.tallyFrequenciesInGroups(colorMatches)

      expect(typeFrequencies["Helix"]).to.be.within(0.233, 0.433);  // 33.3%
      expect(typeFrequencies["Torch"]).to.be.within(0.233, 0.433);  // 33.3%
      expect(typeFrequencies["Beacon"]).to.be.within(0.233, 0.433); // 33.3%

      expect(matchFrequencies["Helix"][true]).to.be.within(0.093, 0.193);    // 14.3%
      expect(matchFrequencies["Helix"][false]).to.be.within(0.807, 0.907);   // 85.7%

      expect(matchFrequencies["Torch"][true]).to.be.within(0.093, 0.193);    // 14.3%
      expect(matchFrequencies["Torch"][false]).to.be.within(0.807, 0.907);   // 85.7%

      // color1 is always a real color and color2 is always None for Beacons
      expect(matchFrequencies["Beacon"][true]).to.be.undefined; // 0%
      expect(matchFrequencies["Beacon"][false]).to.be.equal(1); // 100%
    });

    for (const tier of ["Celestial", "Godly"]) {
      it(`mints Helix cards with two of the same color at ${tier} tier}`, async () => {
        let sampleSize = 0;

        for (let i = 0; i < 100; i += 1) {
          const card1 = await PuzzleCard.mintExact(new PuzzleCard({ ...playerCard, tier }), owner.address);
          const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...telescopeCard, tier }), owner.address);
          const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...activeCard, tier }), owner.address);

          const mintedCard = (await PuzzleCard.lookThroughTelescope([card1, card2, card3]))[0];
          if (mintedCard.type !== "Helix") { continue; }

          expect(mintedCard.color1).to.equal(mintedCard.color2);
          sampleSize += 1;
        };

        expect(sampleSize).to.be.above(10);
      });
    }
  });
});
