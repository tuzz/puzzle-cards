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
  const starCard7 = { series: "Teamwork", puzzle: "3", tier: "Master", type: "Star", color1: "Black", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };

  const validCards = [starCard1, starCard2, starCard3, starCard4, starCard5, starCard6, starCard7];
  const validTypes = [["Star"], ["Star"], ["Star"], ["Star"], ["Star"], ["Star"], ["Star"]];

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
      await contract.mintExactByNames(starCard1, owner.address);
      await contract.mintExactByNames(starCard2, owner.address);
      await contract.mintExactByNames(starCard3, owner.address);
      await contract.mintExactByNames(starCard4, owner.address);
      await contract.mintExactByNames(starCard5, owner.address);
      await contract.mintExactByNames(starCard6, owner.address);
      await contract.mintExactByNames(starCard7, owner.address);

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

    // TODO: the puzzle is picked randomly based on how many of each were provided
    // TODO: the card is signed, limited or a master copy
    //  - introduce a new field in the struct
    //  - limited if <N exist && all inputs are pristine
    //  - master copy if no others exist && all inputs are pristine
    // TODO: test that promotedCards are not signed
    // TODO: puzzleMastery1 can't be performed on signed/limited/master cards
  });
});
