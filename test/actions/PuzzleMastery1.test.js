const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("PuzzleMastery1", () => {
  const artworkCard1 = new PuzzleCard({ ...baseCard, type: "Artwork", variant: "Art 0" });
  const artworkCard2 = new PuzzleCard({ ...baseCard, type: "Artwork", variant: "Art 1" });

  itBehavesLikeAnAction("puzzleMastery1", [artworkCard1, artworkCard2], [["Artwork"], ["Artwork"]], "Master", { skipSameTierTest: true, skipNoDegradeTest: true });

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

    it("cannot be performed if the puzzles don't match", async () => {
      const card1 = await PuzzleCard.mintExact(new PuzzleCard({ ...artworkCard1, puzzle: "Puzzle 1-0" }), owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...artworkCard2, puzzle: "Puzzle 1-1" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canPuzzleMastery1([card1, card2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the puzzles don't match]", reasons);
    });

    it("can be performed if two copies of the same card are used", async () => {
      await PuzzleCard.mintExact(artworkCard1, owner.address);
      await PuzzleCard.mintExact(artworkCard1, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canPuzzleMastery1([artworkCard1, artworkCard1]);

      expect(isAllowed).to.equal(true);
    });

    it("cannot be performed if the same card is used twice (double spent)", async () => {
      await PuzzleCard.mintExact(artworkCard1, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canPuzzleMastery1([artworkCard1, artworkCard1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the same card was used twice]", reasons);
    });

    it("cannot be performed if the artwork is already signed", async () => {
      const card1 = await PuzzleCard.mintExact(artworkCard1, owner.address);

      for (const edition of ["Signed", "Limited", "Master Copy"]) {
        const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...artworkCard2, edition }), owner.address);

        const [isAllowed, reasons] = await PuzzleCard.canPuzzleMastery1([card1, card2]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[the artwork is already signed]", reasons);
      }
    });

    it("mints a star card", async () => {
      const card1 = await PuzzleCard.mintExact(artworkCard1, owner.address);
      const card2 = await PuzzleCard.mintExact(artworkCard2, owner.address);

      const mintedCard = (await PuzzleCard.puzzleMastery1([card1, card2]))[0];

      expect(mintedCard.type).to.equal("Star");
      expect(TestUtils.isRealColor(mintedCard.color1)).to.equal(true);
      expect(mintedCard.color2).to.equal("None");
      expect(mintedCard.variant).to.equal("None");
    });
  });
});
