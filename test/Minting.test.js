const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const PuzzleCard = require("../contracts/PuzzleCard");

chai.use(chaiAsPromised);

describe("Minting", () => {
  let factory, contract, owner, user1, user2;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    PuzzleCard.setContract(contract);
  });

  describe("#mint", () => {
    it("allows a user to mint cards", async () => {
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));

      const cards = await PuzzleCard.mint(1, user2.address);
      expect(cards.length).to.equal(1);

      const numOwned = await PuzzleCard.numberOwned(cards[0], user2.address);
      expect(numOwned).to.equal(1);
    });

    it("sends payment to the contract owner", async () => {
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));
      await PuzzleCard.mint(3, user2.address);

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      const delta = balanceAfter.toBigInt() - balanceBefore.toBigInt();

      const pricePerCard = await PuzzleCard.pricePerCard();
      const expectedPayment = BigInt(3) * pricePerCard;

      expect(delta).to.equal(expectedPayment);
    });

    it("reverts if no payment is provided", async () => {
      const promise = PuzzleCard.CONTRACT.mint(3, user2.address, { ...PuzzleCard.GAS_OPTIONS });
      await expectRevert.unspecified(promise);
    });

    it("reverts if insufficient payment is provided", async () => {
      const pricePerCard = await PuzzleCard.pricePerCard();
      const notEnough = BigInt(3) * pricePerCard - BigInt(1);

      const promise = PuzzleCard.CONTRACT.mint(3, user2.address, { ...PuzzleCard.GAS_OPTIONS, value: notEnough });
      await expectRevert.unspecified(promise);
    });

    it("reverts if the purchaser doesn't have enough funds", async () => {
      await user2.sendTransaction({ to: owner.address, value: 999999999960000000000000n });
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user2));

      const pricePerCard = await PuzzleCard.pricePerCard();
      const promise = PuzzleCard.mint(3, user2.address);

      expect(promise).to.eventually.be.rejectedWith(/doesn't have enough funds/);
    });
  });

  describe("#gift", () => {
    it("allows the contract owner to mint cards as a gift to a user", async () => {
      const cards = await PuzzleCard.gift(1, user1.address);
      expect(cards.length).to.equal(1);

      const balance = await PuzzleCard.numberOwned(cards[0], user1.address);
      expect(balance).to.equal(1);
    });

    it("does not allow other users to gift cards", async () => {
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));
      await expectRevert.unspecified(PuzzleCard.gift(3, user1.address));
    });
  });
});
