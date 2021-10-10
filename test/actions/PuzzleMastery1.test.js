const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("PuzzleMastery1", () => {
  const artworkCard1 = { series: "Teamwork", puzzle: "2", tier: "Master", type: "Artwork", color1: "None", color2: "None", variant: "Art1", condition: "Excellent", edition: "Standard" };
  const artworkCard2 = { series: "Teamwork", puzzle: "2", tier: "Master", type: "Artwork", color1: "None", color2: "None", variant: "Art2", condition: "Excellent", edition: "Standard" };

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

    it("cannot be performed if the puzzles don't match", async () => {
      const tokenID1 =await tokenID(contract.mintExactByNames(artworkCard1, owner.address));
      const tokenID2 =await tokenID(contract.mintExactByNames({ ...artworkCard2, puzzle: "1" }, owner.address));

      const [isAllowed, reasons] = await contract.canPuzzleMastery1([tokenID1, tokenID2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the puzzles don't match]", reasons);
    });

    it("cannot be performed if the same card is used twice", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(artworkCard1, owner.address));

      const [isAllowed, reasons] = await contract.canPuzzleMastery1([tokenID1, tokenID1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the same card was used twice]", reasons);
    });

    it("cannot be performed if the artwork is already signed", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(artworkCard1, owner.address));

      for (const edition of ["Signed", "Limited", "Master Copy"]) {
        const tokenID2 = await tokenID(contract.mintExactByNames({ ...artworkCard2, edition }, owner.address));

        const [isAllowed, reasons] = await contract.canPuzzleMastery1([tokenID1, tokenID2]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[the artwork is already signed]", reasons);
      }
    });

    it("mints a star card", async () => {
      const tokenID1 =await tokenID(contract.mintExactByNames(artworkCard1, owner.address));
      const tokenID2 =await tokenID(contract.mintExactByNames(artworkCard2, owner.address));

      const mintedTokenID = await tokenID(contract.puzzleMastery1([tokenID1, tokenID2]));

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