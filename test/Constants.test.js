const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const PuzzleCard = require("../contracts/PuzzleCard");

describe("Constants", () => {
  let factory, contract, owner, user1;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  it("can get the price to mint the given number of cards", async () => {
    const priceForOne = await PuzzleCard.priceToMint(1);
    expect(priceForOne).to.equal(78830000000000000n);

    const priceForOneThousand = await PuzzleCard.priceToMint(100);
    expect(priceForOneThousand).to.equal(7883000000000000000n);
  });

  it("allows the contract owner to update PRICE_PER_CARD", async () => {
    const originalPrice = PuzzleCard.PRICE_PER_CARD;

    PuzzleCard.PRICE_PER_CARD *= BigInt(2);
    await PuzzleCard.updateConstants(contract);

    await expectRevert.unspecified(contract.mint(1, owner.address, { value: originalPrice }));
  });

  it("allows the contract owner to update METADATA_URI", async () => {
    PuzzleCard.METADATA_URI = "https://foo.com/metadata/{}.json";
    await PuzzleCard.updateConstants(contract);

    const metadataURI = await contract.uri(0);
    expect(metadataURI).to.equal("https://foo.com/metadata/{}.json");
  });

  it("allows the contract owner to update puzzles, e.g. when new puzzles are added", async () => {
    PuzzleCard.SERIES_NAMES = ["Series 0", "Series 1", "Series 2"];
    PuzzleCard.PUZZLE_NAMES = ["Puzzle 0-0", "Puzzle 0-1", "Puzzle 1-0", "Puzzle 1-1", "Puzzle 1-2", "Puzzle 1-3", "Puzzle 2-0"];
    PuzzleCard.NUM_PUZZLES_PER_SERIES = [2, 4, 1];                                                //       ^             ^
    PuzzleCard.PUZZLE_OFFSET_PER_SERIES = [0, 2, 6];                                              //   These puzzles were added.

    await PuzzleCard.updateConstants(contract);

    const tokenIDs = await TestUtils.batchTokenIDs(contract.gift(100, owner.address));
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

    await PuzzleCard.updateConstants(contract);

    let tokenIDs = [];

    for (let i = 0; i < 5; i += 1) {
      const batch = await TestUtils.batchTokenIDs(contract.gift(100, owner.address));
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
    const contractAsUser1 = contract.connect(user1);
    await expectRevert.unspecified(PuzzleCard.updateConstants(contractAsUser1));
  });
});
