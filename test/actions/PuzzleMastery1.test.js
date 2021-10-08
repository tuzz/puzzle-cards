const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("PuzzleMastery1", () => {
  const artworkCard1 = { series: "Teamwork", puzzle: "2", tier: "Master", type: "Artwork", color1: "None", color2: "None", variant: "Art1", condition: "Excellent" };
  const artworkCard2 = { series: "Teamwork", puzzle: "2", tier: "Master", type: "Artwork", color1: "None", color2: "None", variant: "Art2", condition: "Excellent" };

  itBehavesLikeAnAction("puzzleMastery1", [artworkCard1, artworkCard2], [["Artwork"], ["Artwork"]], "Master", { skipSameTierTest: true });

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

    it("cannot be performed if the puzzles are different", async () => {
      await contract.mintExactByNames(artworkCard1, owner.address);
      await contract.mintExactByNames({ ...artworkCard2, puzzle: "1" }, owner.address);

      const [isAllowed, reasons] = await contract.canPuzzleMastery1([1, 2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the puzzles are different]", reasons);
    });

    it("cannot be performed if the same card is used twice", async () => {
      await contract.mintExactByNames(artworkCard1, owner.address);

      const [isAllowed, reasons] = await contract.canPuzzleMastery1([1, 1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the same card was used twice]", reasons);
    });

    it("mints a star card", async () => {
      await contract.mintExactByNames(artworkCard1, owner.address);
      await contract.mintExactByNames(artworkCard2, owner.address);

      await contract.puzzleMastery1([1, 2]);
      const mintedTokenID = 3;

      const type = await contract.typeName(mintedTokenID);
      const color1 = await contract.color1Name(mintedTokenID);
      const color2 = await contract.color2Name(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Star");
      expect(TestUtils.isRealColor(color1)).to.equal(true);
      expect(color2).to.equal("None");
      expect(variant).to.equal("None");
    });
  });
});
