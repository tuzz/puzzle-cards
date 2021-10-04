const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");

describe("PuzzleCard", function () {
  let factory, contract, owner, user1, user2;

  before(async () => {
    factory = await ethers.getContractFactory("PuzzleCard");
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    await contract.setBaseTokenURI("https://example.com/api/");
  });

  describe("#priceToMint", () => {
    it("returns the price to mint the given number of puzzle cards", async () => {
      const priceForOne = await contract.priceToMint(1);
      expect(priceForOne.toBigInt()).to.equal(78830000000000000n);

      const priceForOneThousand = await contract.priceToMint(1000);
      expect(priceForOneThousand.toBigInt()).to.equal(78830000000000000000n);
    });
  });

  describe("#setPriceToMint", () => {
    it("allows the contract owner to set the price of a puzzle card", async () => {
      await contract.setPriceToMint(50000000000000000n);

      const priceForOne = await contract.priceToMint(1);
      expect(priceForOne.toBigInt()).to.equal(50000000000000000n);
    });

    it("does not allow other users to set the price", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setPriceToMint(50000000000000000n));
    });
  });

  describe("#baseTokenURI", () => {
    it("returns the URL of the off-chain API for the puzzle cards", async () => {
      const baseTokenURI = await contract.baseTokenURI();
      expect(baseTokenURI).to.equal("https://example.com/api/");
    });
  });

  describe("#setBaseTokenURI", () => {
    it("allows the contract owner to set the URL of the off-chain API", async () => {
      await contract.setBaseTokenURI("https://foo.com/api/");

      const baseTokenURI = await contract.baseTokenURI();
      expect(baseTokenURI).to.equal("https://foo.com/api/");
    });

    it("does not allow other users to set the price", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setBaseTokenURI("https://foo.com/api"));
    });
  });

  it("can mint a puzzle card to a user", async () => {
    const balanceBefore = await contract.balanceOf(user1.address);
    expect(balanceBefore.toNumber()).to.equal(0);

    await contract.mintOne(user1.address);

    const balanceAfter = await contract.balanceOf(user1.address);
    expect(balanceAfter.toNumber()).to.equal(1);
  });
});
