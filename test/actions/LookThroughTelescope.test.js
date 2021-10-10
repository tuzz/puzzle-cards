const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("LookThroughTelescope", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const telescopeCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Telescope", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent", edition: "Standard" };
  const activeCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Active", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent", edition: "Standard" };

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
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...telescopeCard, variant: "Moon" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...activeCard, variant: "Sun" }, owner.address));

      const [isAllowed, reasons] = await contract.canLookThroughTelescope([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card does not match the telescope]", reasons);
    });

    it("cannot be performed if a moon is used on a telescope with a sun", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...telescopeCard, variant: "Sun" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...activeCard, variant: "Moon" }, owner.address));

      const [isAllowed, reasons] = await contract.canLookThroughTelescope([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card does not match the telescope]", reasons);
    });

    it("cannot be performed if the sun or moon's color does not match the telescope", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...telescopeCard, color1: "Red" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...activeCard, color1: "Blue" }, owner.address));

      const [isAllowed, reasons] = await contract.canLookThroughTelescope([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the sun or moon card does not match the telescope]", reasons);
    });

    it("mints either a Helix, Torch or Beacon card with equal probability", async () => {
      const typeNames = [];
      const colorMatches = [];

      for (let i = 0; i < 1000; i += 1) {
        const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
        const tokenID2 = await tokenID(contract.mintExactByNames(telescopeCard, owner.address));
        const tokenID3 = await tokenID(contract.mintExactByNames(activeCard, owner.address));

        const mintedTokenID = await tokenID(contract.lookThroughTelescope([tokenID1, tokenID2, tokenID3]));

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
        colorMatches.push([type, color1 == color2]);
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
          const tokenID1 = await tokenID(contract.mintExactByNames({ ...playerCard, tier }, owner.address));
          const tokenID2 = await tokenID(contract.mintExactByNames({ ...telescopeCard, tier }, owner.address));
          const tokenID3 = await tokenID(contract.mintExactByNames({ ...activeCard, tier }, owner.address));

          const mintedTokenID = await tokenID(contract.lookThroughTelescope([tokenID1, tokenID2, tokenID3]));

          const type = await contract.typeName(mintedTokenID);
          if (type !== "Helix") { continue; }

          const color1 = await contract.color1Name(mintedTokenID);
          const color2 = await contract.color2Name(mintedTokenID);

          expect(color1).to.equal(color2);
          sampleSize += 1;
        };

        expect(sampleSize).to.be.above(10);
      });
    }
  });
});
