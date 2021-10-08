const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

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
      await contract.mintExactByNames(starCard1, owner.address);
      await contract.mintExactByNames(starCard2, owner.address);
      await contract.mintExactByNames(starCard3, owner.address);
      await contract.mintExactByNames(starCard4, owner.address);
      await contract.mintExactByNames(starCard5, owner.address);
      await contract.mintExactByNames(starCard6, owner.address);
      await contract.mintExactByNames({ ...starCard7, color1: "Red" }, owner.address);

      const [isAllowed, reasons] = await contract.canPuzzleMastery2([1, 2, 3, 4, 5, 6, 7]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[a color was repeated]", reasons);
    });

    it("mints an art card", async () => {
      for (const card of validCards) {
        await contract.mintExactByNames(card, owner.address);
      }

      await contract.puzzleMastery2([1, 2, 3, 4, 5, 6, 7]);
      const mintedTokenID = 8;

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

      for (let i = 0; i < 1000; i += 1) {
        for (const card of validCards) {
          await contract.mintExactByNames(card, owner.address);
        }

        const batchOffset = i * batchSize;
        const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

        await contract.puzzleMastery2(batchTokenIDs);
        const mintedTokenID = batchOffset + batchSize;

        const series = await contract.typeName(mintedTokenID);
        const puzzle = await contract.color1Name(mintedTokenID);

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
          for (const card of pristineCards) {
            await contract.mintExactByNames(card, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

          await contract.puzzleMastery2(batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          expect(await contract.conditionName(mintedTokenID)).to.equal("Pristine");
        }
      });

      it("has a 90%/10% chance to mint a signed/limited edition card", async () => {
        const editionNames = [];

        for (let i = 0; i < 100; i += 1) {
          for (const card of pristineCards) {
            await contract.mintExactByNames(card, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

          await contract.puzzleMastery2(batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

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

        for (let i = 0; i < 500; i += 1) {
          for (const card of pristineCards) {
            await contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

          await contract.puzzleMastery2(batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          editionNames.push(await contract.editionName(mintedTokenID));
        }

        // Master copies are limited edition cards (it's a containment hierarchy).
        const limitedNames = editionNames.filter(s => s === "Limited" || s === "Master Copy");

        expect(limitedNames.length).to.equal(10);
      });

      it("mints the master copy of the puzzle if no other limited editions exist", async () => {
        let masterCopyMinted = false;

        for (let i = 0; i < 100; i += 1) {
          for (const card of pristineCards) {
            await contract.mintExactByNames({ ...card, series: "Teamwork", puzzle: "1" }, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

          await contract.puzzleMastery2(batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          const edition = await contract.editionName(mintedTokenID);

          if (edition === "Master Copy") {
            expect(masterCopyMinted).to.equal(false);
            masterCopyMinted = true;
          }
        }

        expect(masterCopyMinted).to.equal(true);
      });

      it.skip("can mint limited editions and the master copy again if others are discarded", async () => {

      });
    });

    context("when any star card is not pristine", () => {
      it("does not guarantee that the minted card is pristine", async () => {
        const conditionNames = new Set();

        for (let i = 0; i < 100; i += 1) {
          for (const card of validCards) {
            await contract.mintExactByNames(card, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

          await contract.puzzleMastery2(batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          conditionNames.add(await contract.conditionName(mintedTokenID));
        }

        expect(conditionNames.size).to.be.above(1);
      });

      it("always mints a signed edition", async () => {
        for (let i = 0; i < 100; i += 1) {
          for (const card of validCards) {
            await contract.mintExactByNames(card, owner.address);
          }

          const batchOffset = i * batchSize;
          const batchTokenIDs = [1, 2, 3, 4, 5, 6, 7].map(t => t + batchOffset);

          await contract.puzzleMastery2(batchTokenIDs);
          const mintedTokenID = batchOffset + batchSize;

          expect(await contract.editionName(mintedTokenID)).to.equal("Signed");
        }
      });
    });
  });
});
