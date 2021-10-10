const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("PuzzleMastery2", () => {
  const starCard1 = { series: "Teamwork", puzzle: "1", tier: "Master", type: "Star", color1: "Red", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard2 = { series: "Teamwork", puzzle: "1", tier: "Master", type: "Star", color1: "Green", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard3 = { series: "Teamwork", puzzle: "1", tier: "Master", type: "Star", color1: "Blue", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard4 = { series: "Teamwork", puzzle: "1", tier: "Master", type: "Star", color1: "Yellow", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard5 = { series: "Teamwork", puzzle: "2", tier: "Master", type: "Star", color1: "Pink", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard6 = { series: "Teamwork", puzzle: "2", tier: "Master", type: "Star", color1: "White", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const starCard7 = { series: "None", puzzle: "Trial of Skill", tier: "Master", type: "Star", color1: "Black", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };

  const validCards = [starCard1, starCard2, starCard3, starCard4, starCard5, starCard6, starCard7];
  const validTypes = [["Star"], ["Star"], ["Star"], ["Star"], ["Star"], ["Star"], ["Star"]];
  const batchSize = validCards.length + 1;

  itBehavesLikeAnAction("puzzleMastery2", validCards, validTypes, "Master", { skipSameTierTest: true });

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

    it("cannot be performed if a color was repeated", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(starCard1, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(starCard2, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(starCard3, owner.address));
      const tokenID4 = await tokenID(contract.mintExactByNames(starCard4, owner.address));
      const tokenID5 = await tokenID(contract.mintExactByNames(starCard5, owner.address));
      const tokenID6 = await tokenID(contract.mintExactByNames(starCard6, owner.address));
      const tokenID7 = await tokenID(contract.mintExactByNames({ ...starCard7, color1: "Red" }, owner.address));

      const tokenIDs = [tokenID1, tokenID2, tokenID3, tokenID4, tokenID5, tokenID6, tokenID7];
      const [isAllowed, reasons] = await contract.canPuzzleMastery2(tokenIDs);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[a color was repeated]", reasons);
    });

    it("mints an art card", async () => {
      const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
        contract.mintExactByNames(card, owner.address)
      ));

      const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

      const type = await contract.typeName(mintedTokenID);
      const color1 = await contract.color1Name(mintedTokenID);
      const color2 = await contract.color2Name(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Artwork");
      expect(color1).to.equal("None");
      expect(color2).to.equal("None");
      expect(["Art1", "Art2"]).to.include(variant);
    });

    it("randomly chooses the puzzle from one of the star cards", async () => {
      const puzzleNames = [];

      for (let i = 0; i < 200; i += 1) {
        const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
          contract.mintExactByNames(card, owner.address)
        ));

        const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

        const series = await contract.seriesName(mintedTokenID);
        const puzzle = await contract.puzzleName(mintedTokenID);

        puzzleNames.push([series, puzzle]);
      }

      const frequencies = TestUtils.tallyFrequencies(puzzleNames);

      expect(frequencies[["Teamwork", "1"]]).to.be.within(0.5, 0.65);          // 57.1%
      expect(frequencies[["Teamwork", "2"]]).to.be.within(0.2, 0.35);          // 28.6%
      expect(frequencies[["None", "Trial of Skill"]]).to.be.within(0.08, 0.2); // 14.3%
    });

    context("when all star cards are pristine", () => {
      const pristineCards = validCards.map(c => ({ ...c, condition: "Pristine" }));

      it("guarantees that the minted card is also pristine", async () => {
        for (let i = 0; i < 50; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames(card, owner.address)
          ));

          const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

          expect(await contract.conditionName(mintedTokenID)).to.equal("Pristine");
        }
      });

      it("has a 90%/10% chance to mint a signed/limited edition card", async () => {
        const editionNames = [];

        for (let i = 0; i < 100; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames(card, owner.address)
          ));

          const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

          editionNames.push(await contract.editionName(mintedTokenID));
        }

        // Master copies are limited edition cards (it's a containment hierarchy).
        const adjustedNames = editionNames.map(s => s === "Master Copy" ? "Limited" : s);

        const frequencies = TestUtils.tallyFrequencies(adjustedNames);

        expect(frequencies["Signed"]).to.be.above(0.8);  // 90%
        expect(frequencies["Limited"]).to.be.below(0.2); // 10%
      });

      it("limits the total supply of limited edition cards for each puzzle to 10", async () => {
        const editionNames = [];

        for (let i = 0; i < 200; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

          editionNames.push(await contract.editionName(mintedTokenID));
        }

        // Master copies are limited edition cards (it's a containment hierarchy).
        const limitedNames = editionNames.filter(s => s === "Limited" || s === "Master Copy");

        expect(limitedNames.length).to.equal(10);
      });

      it("mints the master copy of the puzzle if no other limited editions exist", async () => {
        let masterCopyMinted = false;

        for (let i = 0; i < 100; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address)
          ));

          const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

          const edition = await contract.editionName(mintedTokenID);

          if (edition === "Master Copy") {
            expect(masterCopyMinted).to.equal(false);
            masterCopyMinted = true;
          }
        }

        expect(masterCopyMinted).to.equal(true);
      });

      it("provides methods to get the number of limited edition cards per puzzle", async () => {
        for (let i = 0; i < 200; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address)
          ));

          await contract.puzzleMastery2(tokenIDs);
        }

        const puzzleIndex = TestUtils.puzzleNames.indexOf("1");

        const [series, puzzle] = await contract.puzzleForIndex(puzzleIndex);
        const numLimited = await contract.numLimitedEditions(series, puzzle);
        const allLimited = await contract.numLimitedEditionsForAllPuzzles();

        expect(numLimited.toString()).to.equal("10");
        expect(allLimited.map(n => n.toString())).to.deep.equal(["0", "0", "10", "0", "0"]);
      });

      it("provides methods to get whether the master copy has been claimed per puzzle", async () => {
        for (let i = 0; i < 50; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address)
          ));

          await contract.puzzleMastery2(tokenIDs);
        }

        const puzzleIndex = TestUtils.puzzleNames.indexOf("1");

        const [series, puzzle] = await contract.puzzleForIndex(puzzleIndex);
        const isClaimed = await contract.masterCopyClaimed(series, puzzle);
        const allClaimed = await contract.masterCopyClaimedForAllPuzzles();

        expect(isClaimed).to.equal(true);
        expect(allClaimed).to.deep.equal([false, false, true, false, false]);
      });

      it("can mint limited editions and the master copy again if others are discarded", async () => {
        const puzzleIndex = TestUtils.puzzleNames.indexOf("1");
        const [series, puzzle] = await contract.puzzleForIndex(puzzleIndex);

        const mintedTokenIDs = [];

        for (let i = 0; i < 200; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address)
          ));

          mintedTokenIDs.push(await tokenID(contract.puzzleMastery2(tokenIDs)));
        }

        const numLimited = await contract.numLimitedEditions(series, puzzle);
        const isClaimed = await contract.masterCopyClaimed(series, puzzle);

        expect(numLimited.toString()).to.equal("10");
        expect(isClaimed).to.equal(true);

        // Discard the first half of the cards.
        for (let i = 0; i < 100; i += 2) {
          const tokenID1 = mintedTokenIDs[i];
          const tokenID2 = mintedTokenIDs[i + 1];

          await contract.discard2Pickup1([tokenID1, tokenID2]);
        }

        const numLimitedAfterDiscard = await contract.numLimitedEditions(series, puzzle);
        const isClaimedAfterDiscard = await contract.masterCopyClaimed(series, puzzle);

        expect(numLimitedAfterDiscard.toString()).not.to.equal("10");
        expect(isClaimedAfterDiscard).to.equal(false)

        // Mint another 100 cards.
        for (let i = 0; i < 100; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(pristineCards, card => (
            contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address)
          ));

          await contract.puzzleMastery2(tokenIDs);
        }

        const numLimitedAfterReMint = await contract.numLimitedEditions(series, puzzle);
        const isClaimedAfterReMint = await contract.masterCopyClaimed(series, puzzle);

        expect(numLimitedAfterReMint.toString()).to.equal("10");
        expect(isClaimedAfterReMint).to.equal(true)
      });
    });

    context("when any star card is not pristine", () => {
      it("does not guarantee that the minted card is pristine", async () => {
        const conditionNames = new Set();

        for (let i = 0; i < 100; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames(card, owner.address)
          ));

          const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

          conditionNames.add(await contract.conditionName(mintedTokenID));
        }

        expect(conditionNames.size).to.be.above(1);
      });

      it("always mints a signed edition", async () => {
        for (let i = 0; i < 100; i += 1) {
          const tokenIDs = await TestUtils.tokenIDs(validCards, card => (
            contract.mintExactByNames(card, owner.address)
          ));

          const mintedTokenID = await tokenID(contract.puzzleMastery2(tokenIDs));

          expect(await contract.editionName(mintedTokenID)).to.equal("Signed");
        }
      });
    });
  });
});
