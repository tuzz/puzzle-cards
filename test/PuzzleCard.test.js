const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");

describe("PuzzleCard", () => {
  let factory, contract, owner, user1, user2;

  before(async () => {
    factory = await ethers.getContractFactory("PuzzleCard");
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    await contract.setBaseTokenURI("https://example.com/api/");
  });

  describe("#mint", () => {
    it("allows a user to mint puzzle cards in exchange for payment", async () => {
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
    it("allows the contract owner to mint puzzle cards as a gift to a user", async () => {
      await contract.gift(3, user1.address);
      const balance = await contract.balanceOf(user1.address);

      expect(balance.toNumber()).to.equal(3);
    });

    it("does not allow other users to gift puzzle cards", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.gift(3, user1.address));
    });
  });

  describe("#priceToMint", () => {
    it("returns the price to mint the given number of puzzle cards", async () => {
      const priceForOne = await contract.priceToMint(1);
      expect(priceForOne.toBigInt()).to.equal(78830000000000000n);

      const priceForOneThousand = await contract.priceToMint(100);
      expect(priceForOneThousand.toBigInt()).to.equal(7883000000000000000n);
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

  describe("#setPuzzleNames", () => {
    it("allows the contract owner to update puzzle names, e.g. when new puzzles are added", async () => {
      const seriesNames = ["None", "Teamwork", "Mutual Exclusion"];
      const puzzleNames = ["Trial of Skill", "Trial of Reign", "1", "2", "3", "4", "1"];
      const numPuzzlesPerSeries = [2, 4, 1];
      const puzzleOffsetPerSeries = [0, 2, 6];

      await contract.setPuzzleNames(seriesNames, puzzleNames, numPuzzlesPerSeries, puzzleOffsetPerSeries);
      await contract.gift(100, owner.address);

      const names = [];

      for (let tokenID = 1; tokenID <= 100; tokenID += 1) {
        const seriesName = await contract.seriesName(tokenID);
        const puzzleName = await contract.puzzleName(tokenID);

        names.push([seriesName, puzzleName]);
      }

      expect(names).to.deep.include(["Teamwork", "4"]);
      expect(names).to.deep.include(["Mutual Exclusion", "1"]);
    });

    it("does not allow other users to update puzzle names", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setPuzzleNames([], [], [], []));
    });
  });

  describe("#setVariantNames", () => {
    it("allows the contract owner to update variant names, e.g. when new art is added", async () => {
      const variantNames = ["None", "Sun", "Moon", "Open", "Closed", "Player Facing Forwards", "Player Facing Right"];
      const numVariantsPerType   = [2, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0];
      const variantOffsetPerType = [5, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0];
                              //    ^
                              // the number of variants and the offset for the player type changed from 0

      await contract.setVariantNames(variantNames, numVariantsPerType, variantOffsetPerType);
      for (let i = 0; i < 5; i += 1) await contract.gift(100, owner.address);

      const names = [];

      for (let tokenID = 1; tokenID <= 500; tokenID += 1) {
        const typeName = await contract.typeName(tokenID);
        const variantName = await contract.variantName(tokenID);

        names.push([typeName, variantName]);
      }

      expect(names).to.deep.include(["Player", "Player Facing Forwards"]);
      expect(names).to.deep.include(["Player", "Player Facing Right"]);
    });

    it("does not allow other users to update variant names", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setVariantNames([], [], []));
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

  describe("#combine", () => {
    it("allows a puzzle card owner to combine several cards to mint a new one", async () => {
      const contractAsUser1 = contract.connect(user1);

      const price = await contractAsUser1.priceToMint(3);
      await contractAsUser1.mint(3, user1.address, { value: price });

      const balanceBefore = await contractAsUser1.balanceOf(user1.address);
      expect(balanceBefore.toNumber()).to.equal(3);

      await contractAsUser1.combine([1, 2]);

      const balanceAfter = await contractAsUser1.balanceOf(user1.address);
      expect(balanceAfter.toNumber()).to.equal(2);
    });
  });
});
