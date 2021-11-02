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

  it("can get the price per tier", async () => {
    const pricePerTierInWei = await PuzzleCard.pricePerTierInWei();

    expect(pricePerTierInWei).to.deep.equal([
      5263157894736843n, // $0.01
      26315789473684212n, // $0.05
      105263157894736850n, // $0.20
      526315789473684160n, // $1.00
      3684210526315790000n, // $7.00
      26315789473684214000n, // $50.00
      263157894736842130000n // $500.00
    ]);
  });

  it("allows the contract owner to update the price when the exchange rate changes", async () => {
    await PuzzleCard.updatePrices(1.50);

    const pricePerTierInWei = await PuzzleCard.pricePerTierInWei();

    expect(pricePerTierInWei).to.deep.equal([
      6666666666666667n,
      33333333333333332n,
      133333333333333328n,
      666666666666666624n, // <-- Mint at this tier below.
      4666666666666667008n,
      33333333333333336064n,
      333333333333333311488n
    ]);

    // Verify that the price for minting has actually been taken into account.
    await contract.mint(1, 3, owner.address, { value: 666666666666666624n });
    await expectRevert.unspecified(contract.mint(1, 3, owner.address, { value: 666666666666666623n }));
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
});
