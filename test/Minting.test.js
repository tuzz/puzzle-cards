const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");

describe("Minting", () => {
  let factory, contract, owner, user1, user2;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  describe("#mint", () => {
    it("allows a user to mint cards in exchange for payment", async () => {
      const contractAsUser1 = contract.connect(user1);

      const balanceBefore = await contractAsUser1.balanceOf(user2.address);
      expect(balanceBefore.toNumber()).to.equal(0);

      const price = await contractAsUser1.priceToMint(3);
      await contractAsUser1.mint(3, user2.address, { value: price });

      const balanceAfter = await contractAsUser1.balanceOf(user2.address);
      expect(balanceAfter.toNumber()).to.equal(3);
    });

    it("sends payment to the contract owner", async () => {
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const contractAsUser1 = contract.connect(user1);
      const price = await contractAsUser1.priceToMint(3);
      await contractAsUser1.mint(3, user2.address, { value: price });

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      const delta = balanceAfter.toBigInt() - balanceBefore.toBigInt();

      expect(delta).to.equal(price.toBigInt());
    });

    it("reverts if no payment is provided", async () => {
      await expectRevert.unspecified(contract.mint(3, user2.address));
    });

    it("reverts if insufficient payment is provided", async () => {
      const price = contract.priceToMint(3);
      await expectRevert.unspecified(contract.mint(3, user2.address, { value: price - 1 }));
    });

    it("reverts if the number to mint is 0", async () => {
      await expectRevert.unspecified(contract.mint(0, user2.address));
    });

    it("reverts if the number to mint is greater than one hundred", async () => {
      const price = contract.priceToMint(101);
      await expectRevert.unspecified(contract.mint(101, user2.address, { value: price }));
    });
  });

  describe("#gift", () => {
    it("allows the contract owner to mint cards as a gift to a user", async () => {
      await contract.gift(3, user1.address);
      const balance = await contract.balanceOf(user1.address);

      expect(balance.toNumber()).to.equal(3);
    });

    it("does not allow other users to gift cards", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.gift(3, user1.address));
    });
  });
});
