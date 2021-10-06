const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("../TestUtils");

describe("ActivateSunOrMoon", () => {
  let factory, contract, owner, user1;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    TestUtils.addHelpfulMethodsTo(contract);
  });

  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const cloakCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Cloak", color1: "Black", color2: "None", variant: "None", condition: "Excellent" };
  const inactiveCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Inactive", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent" };

  describe("#activateSunOrMoon", () => {
    it("discards the provided cards and mints a new one", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames(inactiveCard, owner.address);

      await contract.activateSunOrMoon([1, 2]);

      expect(await contract.isDiscarded(1)).to.equal(true);
      expect(await contract.isDiscarded(2)).to.equal(true);
      expect(await contract.isDiscarded(3)).to.equal(false);
    });

    it("sets some of the new card's attributes from the inactive card", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames(inactiveCard, owner.address);

      await contract.activateSunOrMoon([1, 2]);

      expect(await contract.tierName(3)).to.equal("Mortal");
      expect(await contract.typeName(3)).to.equal("Active");
      expect(await contract.color1Name(3)).to.equal("Black");
      expect(await contract.color2Name(3)).to.equal("None");
      expect(await contract.variantName(3)).to.equal("Sun");
    });

    it("reverts if #canActivateSunOrMoon is false", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...inactiveCard, tier: "Godly" }, owner.address);

      await expectRevert.unspecified(contract.activateSunOrMoon([1, 2]));
    });
  });

  describe("#canActivateSunOrMoon", () => {
    it("returns false if the wrong number of cards is provided", async () => {
      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[2 cards are required]", reasons);
    });

    it("returns false if the user doesn't own all the cards", async () => {
      await contract.mintExactByNames(playerCard, user1.address);

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[user doesn't own all the cards]", reasons);
    });

    it("returns false if the tiers don't match", async () => {
      await contract.mintExactByNames({ ...playerCard, tier: "Immortal" }, owner.address);
      await contract.mintExactByNames(inactiveCard, owner.address);

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the tiers of the cards don't match]", reasons);
    });

    it("returns false if no player, crab or cloak card is provided", async () => {
      await contract.mintExactByNames(inactiveCard, owner.address);
      await contract.mintExactByNames(inactiveCard, owner.address);

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1, 2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[a player, crab or cloak card is required]", reasons);
    });

    it("returns false if no inactive sun or moon card is provided", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames(playerCard, owner.address);

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1, 2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[an inactive sun or moon card is required]", reasons);
    });

    it("returns false if the cloak's color does not match that of the sun or moon", async () => {
      await contract.mintExactByNames({ ...cloakCard, color1: "Red" }, owner.address);
      await contract.mintExactByNames({ ...inactiveCard, color1: "Blue" }, owner.address);

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1, 2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the color of the cloak does not match]", reasons);
    });

    it("returns true otherwise", async () => {
      await contract.mintExactByNames({ ...cloakCard, color: "Red" }, owner.address);
      await contract.mintExactByNames({ ...inactiveCard, color: "Red" }, owner.address);

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1, 2]);

      expect(isAllowed).to.equal(true, reasons);
      expect(reasons.filter(s => s !== "")).to.be.empty;
    });

    context("at ethereal tier", () => {
      it("returns false if a non-cloak card is provided", async () => {
        await contract.mintExactByNames({ ...playerCard, tier: "Ethereal" }, owner.address);
        await contract.mintExactByNames({ ...inactiveCard, tier: "Ethereal" }, owner.address);

        const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1, 2]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[only works with a cloak card at this tier]", reasons);
      });
    });

    context("at godly tier", () => {
      it("returns false if a non-cloak card is provided", async () => {
        await contract.mintExactByNames({ ...playerCard, tier: "Godly" }, owner.address);
        await contract.mintExactByNames({ ...inactiveCard, tier: "Godly" }, owner.address);

        const [isAllowed, reasons] = await contract.canActivateSunOrMoon([1, 2]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[only works with a cloak card at this tier]", reasons);
      });
    });
  });
});
