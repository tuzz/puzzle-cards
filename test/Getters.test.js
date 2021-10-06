const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");

describe("Getters", () => {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  describe("#priceToMint", () => {
    it("returns the price to mint the given number of puzzle cards", async () => {
      const priceForOne = await contract.priceToMint(1);
      expect(priceForOne.toBigInt()).to.equal(78830000000000000n);

      const priceForOneThousand = await contract.priceToMint(100);
      expect(priceForOneThousand.toBigInt()).to.equal(7883000000000000000n);
    });
  });

  describe("#baseTokenURI", () => {
    it("returns the URL of the off-chain API for the puzzle cards", async () => {
      const baseTokenURI = await contract.baseTokenURI();
      expect(baseTokenURI).to.equal("https://example.com/api/");
    });
  });

  describe("#slug", () => {
    it("lowercases the attribute names", async () => {
      await contract.gift(10, owner.address);

      for (let tokenID = 1; tokenID <= 10; tokenID += 1) {
        const slug = await contract.slug(tokenID);
        expect(slug).to.equal(slug.toLowerCase());
      }
    });

    it("replaces spaces in attribute names with dashes", async () => {
      await contract.gift(10, owner.address);

      for (let tokenID = 1; tokenID <= 10; tokenID += 1) {
        const slug = await contract.slug(tokenID);
        expect(slug).to.equal(slug.replaceAll(" ", "-"));
      }
    });
  });
});
