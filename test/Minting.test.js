const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const PuzzleCard = require("../public/PuzzleCard");

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

      const cards = await PuzzleCard.mint(1, "Mortal", user2.address);
      expect(cards.length).to.equal(1);

      const numOwned = await PuzzleCard.numberOwned(cards[0], user2.address);
      expect(numOwned).to.equal(1);
    });

    it("mints to the msg.sender if no address is given", async () => {
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));

      const cards = await PuzzleCard.mint(1, "Mortal");
      expect(cards.length).to.equal(1);

      const numOwned = await PuzzleCard.numberOwned(cards[0], user1.address);
      expect(numOwned).to.equal(1);
    });

    it("sends payment to the contract owner", async () => {
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));
      await PuzzleCard.mint(3, "Mortal", user2.address);

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      const delta = balanceAfter.toBigInt() - balanceBefore.toBigInt();

      const pricePerCard = await PuzzleCard.priceToMint("Mortal");
      const expectedPayment = BigInt(3) * pricePerCard;

      expect(delta).to.equal(expectedPayment);
    });

    it("does not allow users to mint at a tier until a card is promoted to that tier", async () => {
      const openDoorCard = await PuzzleCard.mintExact(new PuzzleCard({ ...TestUtils.baseCard, type: "Door", variant: "Open" }), user1.address);
      const playerCard = await PuzzleCard.mintExact(new PuzzleCard({ ...TestUtils.baseCard, type: "Player" }), user1.address);

      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));
      await PuzzleCard.mint(1, "Mortal", user1.address);

      const promise1 = PuzzleCard.mint(1, "Immortal", user1.address);
      await expectRevert.unspecified(promise1);

      const promise2 = PuzzleCard.mint(1, "Master", user1.address);
      await expectRevert.unspecified(promise2);

      const mintedCard = (await PuzzleCard.goThroughStarDoor([openDoorCard, playerCard]))[0];
      expect(mintedCard.tier).to.equal("Immortal");

      await PuzzleCard.mint(1, "Immortal", user1.address); // This should work now.

      const promise3 = PuzzleCard.mint(1, "Master", user1.address);
      await expectRevert.unspecified(promise3);
    });

    it("allows users to pay to unlock minting at all tiers", async () => {
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));
      await PuzzleCard.unlockMintingAtAllTiers(user1.address); // Called as user1.

      await PuzzleCard.mint(1, "Immortal", user1.address);
      await PuzzleCard.mint(1, "Master", user1.address);
    });

    it("allows the contract owner to unlock minting for a user without having to pay themself", async () => {
      await PuzzleCard.unlockMintingAtAllTiers(user1.address); // Called as owner.
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));

      await PuzzleCard.mint(1, "Immortal", user1.address);
      await PuzzleCard.mint(1, "Master", user1.address);
    });

    it("applies the tier restriction to the msg.sender, not the recipient", async () => {
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));
      await PuzzleCard.unlockMintingAtAllTiers(user1.address);

      // This should be allowed so that user1 can gift cards to user2, even
      // though user2 hasn't unlocked the Immortal tier. They can do this anyway
      // by transferring tokens so there's no reason to deny it here.
      await PuzzleCard.mint(1, "Immortal", user2.address);
    });

    it("does not apply the tier restriction to the contract owner", async () => {
      // We could set maxTierUnlocked[owner()] = MASTER_TIER in the contract
      // constructor, but I'd rather not do that so that it's easier to test the
      // UI for unlocking when connected to the contract owner's account.
      await PuzzleCard.mint(1, "Immortal", user2.address);
    });

    it("reverts if no payment is provided", async () => {
      const contractAsUser1 = contract.connect(user1);

      const promise = contractAsUser1.mint(3, 0, user1.address, { ...PuzzleCard.GAS_OPTIONS });
      await expectRevert.unspecified(promise);
    });

    it("reverts if insufficient payment is provided", async () => {
      const pricePerCard = await PuzzleCard.priceToMint("Mortal");
      const notEnough = BigInt(3) * pricePerCard - BigInt(1);

      const contractAsUser1 = contract.connect(user1);

      const promise = contractAsUser1.mint(3, 0, user1.address, { ...PuzzleCard.GAS_OPTIONS, value: notEnough });
      await expectRevert.unspecified(promise);
    });

    it("reverts if the purchaser doesn't have enough funds", async () => {
      await user1.sendTransaction({ to: owner.address, value: 999999999940000000000000n });
      PuzzleCard.setContract(PuzzleCard.CONTRACT.connect(user1));

      const pricePerCard = await PuzzleCard.priceToMint("Mortal");
      const promise = PuzzleCard.mint(3, "Mortal", user1.address);

      expect(promise).to.eventually.be.rejectedWith(/doesn't have enough funds/);
    });
  });

  it("allows the contract owner to mint cards without having to pay themself", async () => {
    const cards = await PuzzleCard.mint(1, "Mortal", user1.address);
    expect(cards.length).to.equal(1);

    const balance = await PuzzleCard.numberOwned(cards[0], user1.address);
    expect(balance).to.equal(1);
  });

  it("estimates the gas limit reasonably well for different numbers of cards minted", async () => {
    for (let numberToMint = 1; numberToMint <= PuzzleCard.MAX_BATCH_SIZE; numberToMint += 1) {
      const gasLimit = PuzzleCard.gasLimitToMint(numberToMint);
      let maxGas = -Infinity;

      // Decrease the sample size being tested as gas usage certainty increases.
      // Otherwise, the test would take too long.
      const sampleSize = Math.max((100 - numberToMint / 2), 3);

      for (let i = 0; i < sampleSize; i += 1) {
        const transaction = await contract.mint(numberToMint, 0, owner.address, { gasLimit: PuzzleCard.GAS_LIMIT_MAXIMUM });
        const gasUsed = (await transaction.wait()).gasUsed.toNumber();

        maxGas = Math.max(maxGas, gasUsed);
      }

      //console.log(numberToMint, maxGas, gasLimit, maxGas / gasLimit);
      expect(maxGas / gasLimit).to.be.within(0.3, 0.85, `The gas limit prediction was poor for ${numberToMint} cards.`);

      // Don't check every numberToMint as the number increases.
      // Otherwise, the test would take too long.
      if (numberToMint >= 10) { numberToMint += 1; }
      if (numberToMint >= 20) { numberToMint += 3; }
      if (numberToMint >= 70) { numberToMint += 10; }
      if (numberToMint >= 120) { numberToMint += 20; }
    }
  });
});
