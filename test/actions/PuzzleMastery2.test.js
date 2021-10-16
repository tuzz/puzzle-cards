const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("PuzzleMastery2", () => {
  const starCard1 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-0", tier: "Master", color1: "Red" });
  const starCard2 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-0", tier: "Master", color1: "Green" });
  const starCard3 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-0", tier: "Master", color1: "Blue" });
  const starCard4 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-0", tier: "Master", color1: "Yellow" });
  const starCard5 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-1", tier: "Master", color1: "Pink" });
  const starCard6 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-1", tier: "Master", color1: "White" });
  const starCard7 = new PuzzleCard({ ...baseCard, type: "Star", puzzle: "Puzzle 1-2", tier: "Master", color1: "Black" });

  const validCards = [starCard1, starCard2, starCard3, starCard4, starCard5, starCard6, starCard7];
  const validTypes = [["Star"], ["Star"], ["Star"], ["Star"], ["Star"], ["Star"], ["Star"]];
  const batchSize = validCards.length + 1;

  itBehavesLikeAnAction("puzzleMastery2", validCards, validTypes, "Master", { skipSameTierTest: true, skipNoDegradeTest: true });

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

    it("cannot be performed if a color was repeated", async () => {
      const card1 = await PuzzleCard.mintExact(starCard1, owner.address);
      const card2 = await PuzzleCard.mintExact(starCard2, owner.address);
      const card3 = await PuzzleCard.mintExact(starCard3, owner.address);
      const card4 = await PuzzleCard.mintExact(starCard4, owner.address);
      const card5 = await PuzzleCard.mintExact(starCard5, owner.address);
      const card6 = await PuzzleCard.mintExact(starCard6, owner.address);
      const card7 = await PuzzleCard.mintExact(new PuzzleCard({ ...starCard7, color1: "Red" }), owner.address);

      const cards = [card1, card2, card3, card4, card5, card6, card7];
      const [isAllowed, reasons] = await PuzzleCard.canPuzzleMastery2(cards);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[a color was repeated]", reasons);
    });

    it("mints an art card", async () => {
      for (const card of validCards) {
        await PuzzleCard.mintExact(card, owner.address);
      }

      const mintedCard = await PuzzleCard.puzzleMastery2(validCards);

      expect(mintedCard.type).to.equal("Artwork");
      expect(mintedCard.color1).to.equal("None");
      expect(mintedCard.color2).to.equal("None");
      expect(["Art 0", "Art 1"]).to.include(mintedCard.variant);
    });

    it("randomly chooses the puzzle from one of the star cards", async () => {
      const puzzleNames = [];

      for (let i = 0; i < 200; i += 1) {
        for (const card of validCards) {
          await PuzzleCard.mintExact(card, owner.address);
        }

        const mintedCard = await PuzzleCard.puzzleMastery2(validCards);

        puzzleNames.push([mintedCard.series, mintedCard.puzzle]);
      }

      const frequencies = TestUtils.tallyFrequencies(puzzleNames);

      expect(frequencies[["Series 1", "Puzzle 1-0"]]).to.be.within(0.5, 0.65); // 57.1%
      expect(frequencies[["Series 1", "Puzzle 1-1"]]).to.be.within(0.2, 0.35); // 28.6%
      expect(frequencies[["Series 1", "Puzzle 1-2"]]).to.be.within(0.08, 0.2); // 14.3%
    });

    context("when all star cards are pristine", () => {
      const pristineCards = validCards.map(c => new PuzzleCard({ ...c, condition: "Pristine" }));

      it("guarantees that the minted card is also pristine", async () => {
        for (let i = 0; i < 50; i += 1) {
          for (const card of pristineCards) {
            await PuzzleCard.mintExact(card, owner.address);
          }

          const mintedCard = await PuzzleCard.puzzleMastery2(pristineCards);

          expect(mintedCard.condition).to.equal("Pristine");
        }
      });

      it("has a 90%/10% chance to mint a signed/limited edition card", async () => {
        const editionNames = [];

        for (let i = 0; i < 100; i += 1) {
          for (const card of pristineCards) {
            await PuzzleCard.mintExact(card, owner.address);
          }

          const mintedCard = await PuzzleCard.puzzleMastery2(pristineCards);

          editionNames.push(mintedCard.edition);
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
          const cards = [];

          for (const card of pristineCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, puzzle: "Puzzle 1-1" }), owner.address));
          }

          const mintedCard = await PuzzleCard.puzzleMastery2(cards);

          editionNames.push(mintedCard.edition);
        }

        // Master copies are limited edition cards (it's a containment hierarchy).
        const limitedNames = editionNames.filter(s => s === "Limited" || s === "Master Copy");

        expect(limitedNames.length).to.equal(10);
      });

      it("mints the master copy of the puzzle if no other limited editions exist", async () => {
        let masterCopyMinted = false;

        for (let i = 0; i < 100; i += 1) {
          const cards = [];

          for (const card of pristineCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, puzzle: "Puzzle 1-1" }), owner.address));
          }

          const mintedCard = await PuzzleCard.puzzleMastery2(cards);

          if (mintedCard.edition === "Master Copy") {
            expect(masterCopyMinted).to.equal(false);
            masterCopyMinted = true;
          }
        }

        expect(masterCopyMinted).to.equal(true);
      });

      it("provides a method to get the number of limited edition cards for a puzzle", async () => {
        for (let i = 0; i < 200; i += 1) {
          const cards = [];

          for (const card of pristineCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, puzzle: "Puzzle 1-1" }), owner.address));
          }

          await PuzzleCard.puzzleMastery2(cards);
        }

        const card = new PuzzleCard({ series: "Series 1", puzzle: "Puzzle 1-1" });
        const numLimited = await PuzzleCard.numLimitedEditions(card);

        expect(numLimited.toNumber()).to.equal(10);
      });

      it("provides a method to get whether the master copy has been claimed for a puzzle", async () => {
        for (let i = 0; i < 50; i += 1) {
          const cards = [];

          for (const card of pristineCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, puzzle: "Puzzle 1-1" }), owner.address));
          }

          await PuzzleCard.puzzleMastery2(cards);
        }

        const card = new PuzzleCard({ series: "Series 1", puzzle: "Puzzle 1-1" });
        const isClaimed = await PuzzleCard.masterCopyClaimed(card);

        expect(isClaimed).to.equal(true);
      });

      it("can mint limited editions and the master copy again if others are discarded", async () => {
        const card = new PuzzleCard({ series: "Series 1", puzzle: "Puzzle 1-1" });
        const mintedCards = [];

        for (let i = 0; i < 300; i += 1) {
          const cards = [];

          for (const card of pristineCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, puzzle: "Puzzle 1-1" }), owner.address));
          }

          mintedCards.push(await PuzzleCard.puzzleMastery2(cards));
        }

        const numLimited = await PuzzleCard.numLimitedEditions(card);
        const isClaimed = await PuzzleCard.masterCopyClaimed(card);

        expect(numLimited.toNumber()).to.equal(10);
        expect(isClaimed).to.equal(true);

        // Discard the first half of the cards.
        for (let i = 0; i < 150; i += 2) {
          const card1 = mintedCards[i];
          const card2 = mintedCards[i + 1];

          await PuzzleCard.discard2Pickup1([card1, card2]);
        }

        const numLimitedAfterDiscard = await PuzzleCard.numLimitedEditions(card);
        const isClaimedAfterDiscard = await PuzzleCard.masterCopyClaimed(card);

        expect(numLimitedAfterDiscard.toNumber()).not.to.equal(10);
        expect(isClaimedAfterDiscard).to.equal(false)

        // Mint another 150 cards.
        for (let i = 0; i < 150; i += 1) {
          const cards = [];

          for (const card of pristineCards) {
            cards.push(await PuzzleCard.mintExact(new PuzzleCard({ ...card, puzzle: "Puzzle 1-1" }), owner.address));
          }

          await PuzzleCard.puzzleMastery2(cards);
        }

        const numLimitedAfterReMint = await PuzzleCard.numLimitedEditions(card);
        const isClaimedAfterReMint = await PuzzleCard.masterCopyClaimed(card);

        expect(numLimitedAfterReMint.toNumber()).to.equal(10);
        expect(isClaimedAfterReMint).to.equal(true)
      });
    });

    context("when any star card is not pristine", () => {
      it("does not guarantee that the minted card is pristine", async () => {
        const conditionNames = new Set();

        for (let i = 0; i < 100; i += 1) {
          for (const card of validCards) {
            await PuzzleCard.mintExact(card, owner.address);
          }

          const mintedCard = await PuzzleCard.puzzleMastery2(validCards);

          conditionNames.add(mintedCard.condition);
        }

        expect(conditionNames.size).to.be.above(1);
      });

      it("always mints a signed edition", async () => {
        for (let i = 0; i < 100; i += 1) {
          for (const card of validCards) {
            await PuzzleCard.mintExact(card, owner.address);
          }

          const mintedCard = await PuzzleCard.puzzleMastery2(validCards);

          expect(mintedCard.edition).to.equal("Signed");
        }
      });
    });
  });
});
