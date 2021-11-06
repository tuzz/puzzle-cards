const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const PuzzleCard = require("../public/PuzzleCard");

describe("Constants", () => {
  let factory, contract, owner, user1;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    PuzzleCard.setContract(contract);
  });

  it("allows the contract owner to update the base price when the exchange rate changes", async () => {
    await PuzzleCard.setExchangeRate(5.00);

    const basePriceInWei = await PuzzleCard.basePriceInWei();
    expect(basePriceInWei).to.deep.equal(2000000000000000n);

    // Verify that the price for minting has actually been taken into account.
    for (let tier = 0; tier < PuzzleCard.TIER_NAMES.length; tier += 1) {
      const tierMultiplier = BigInt(PuzzleCard.MINT_PRICE_MULTIPLERS[tier]);
      const price = basePriceInWei * tierMultiplier;

      await contract.mint(1, tier, owner.address, { value: price });
      await expectRevert.unspecified(contract.mint(1, tier, owner.address, { value: price - BigInt(1) }));
    }
  });

  it("can get the price per card at a given tier", async () => {
    const priceBefore = await PuzzleCard.priceToMint("Godly");
    expect(priceBefore).to.equal(263157894736842150n);

    await PuzzleCard.setExchangeRate(5.00);

    const priceAfter = await PuzzleCard.priceToMint("Godly");
    expect(priceAfter).to.equal(100000000000000000n);
  });

  it("allows the contract owner to update MINT_PRICE_MULTIPLERS", async () => {
    const priceBefore = await PuzzleCard.priceToMint("Godly");
    expect(priceBefore).to.equal(263157894736842150n);

    PuzzleCard.MINT_PRICE_MULTIPLERS = [0, 0, 0, 0, 0, 1000, 0]
    await PuzzleCard.updateConstants();

    const priceAfter = await PuzzleCard.priceToMint("Godly");
    expect(priceAfter).to.deep.equal(5263157894736843000n);

    // Verify that the multiplier has actually been taken into account.
    await contract.mint(1, 5, owner.address, { value: priceAfter });
    await expectRevert.unspecified(contract.mint(1, 5, owner.address, { value: priceAfter - BigInt(1) }));
  });

  it("allows the contract owner to update UNLOCK_PRICE_MULTIPLIER", async () => {
    const priceBefore = await PuzzleCard.priceToUnlock();
    expect(priceBefore).to.equal(52631578947368430000n);

    PuzzleCard.UNLOCK_PRICE_MULTIPLIER = 1;
    await PuzzleCard.updateConstants();

    const priceAfter = await PuzzleCard.priceToUnlock();
    expect(priceAfter).to.equal(5263157894736843n);

    // Verify that the multiplier has actually been taken into account.
    await contract.unlockMintingAtAllTiers(owner.address, { value: priceAfter });
    await expectRevert.unspecified(contract.unlockMintingAtAllTiers(owner.address, { value: priceAfter - BigInt(1) }));
  });

  it("allows the contract owner to update METADATA_URI", async () => {
    PuzzleCard.METADATA_URI = "https://foo.com/metadata/{}.json";
    await PuzzleCard.updateConstants();

    const metadataURI = await contract.uri(0);
    expect(metadataURI).to.equal("https://foo.com/metadata/{}.json");
  });

  it("allows the contract owner to update puzzles, e.g. when new puzzles are added", async () => {
    PuzzleCard.SERIES_NAMES = ["Series 0", "Series 1", "Series 2"];
    PuzzleCard.PUZZLE_NAMES = ["Puzzle 0-0", "Puzzle 0-1", "Puzzle 1-0", "Puzzle 1-1", "Puzzle 1-2", "Puzzle 1-3", "Puzzle 2-0"];
    PuzzleCard.NUM_PUZZLES_PER_SERIES = [2, 4, 1];                                                //       ^             ^
    PuzzleCard.PUZZLE_OFFSET_PER_SERIES = [0, 2, 6];                                              //   These puzzles were added.

    await PuzzleCard.updateConstants();

    const tokenIDs = await TestUtils.batchTokenIDs(contract.gift(100, 0, owner.address));
    const names = [];

    for (const tokenID of tokenIDs) {
      const card = PuzzleCard.fromTokenID(tokenID);

      names.push([card.series, card.puzzle]);
    }

    expect(names).to.deep.include(["Series 1", "Puzzle 1-3"]);
    expect(names).to.deep.include(["Series 2", "Puzzle 2-0"]);
  });

  it("allows the contract owner to update variants, e.g. when new art is added", async () => {
    PuzzleCard.VARIANT_NAMES = ["None", "Sun", "Moon", "Open", "Closed", "Player Facing Forwards", "Player Facing Right"];
    PuzzleCard.NUM_VARIANTS_PER_TYPE   = [2, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0];
    PuzzleCard.VARIANT_OFFSET_PER_TYPE = [5, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0];
                                    //    ^
                                    // the number of variants and the offset for the player type changed from 0

    await PuzzleCard.updateConstants();

    let tokenIDs = [];

    for (let i = 0; i < 5; i += 1) {
      const batch = await TestUtils.batchTokenIDs(contract.gift(100, 0, owner.address));
      tokenIDs = tokenIDs.concat(batch);
    }

    const names = [];

    for (const tokenID of tokenIDs) {
      const card = PuzzleCard.fromTokenID(tokenID);

      names.push([card.type, card.variant]);
    }

    expect(names).to.deep.include(["Player", "Player Facing Forwards"]);
    expect(names).to.deep.include(["Player", "Player Facing Right"]);
  });

  it("does not allow other users to update constants", async () => {
    PuzzleCard.setContract(contract.connect(user1));
    await expectRevert.unspecified(PuzzleCard.updateConstants());
  });

  it("does not allow other users to set the base price", async () => {
    PuzzleCard.setContract(contract.connect(user1));
    await expectRevert.unspecified(PuzzleCard.setExchangeRate(0));
  });
});
