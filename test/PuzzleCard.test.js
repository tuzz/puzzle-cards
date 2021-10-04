const { expect } = require("chai");
const openseaProxyAddress = "0x0000000000000000000000000000000000000000";

describe("PuzzleCard", function () {
  let factory, contract, owner, user1, user2;

  before(async () => {
    factory = await ethers.getContractFactory("PuzzleCard");
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(openseaProxyAddress);
    await contract.deployed();
  });

  it("can mint a puzzle card to a user", async () => {
    const balanceBefore = await contract.balanceOf(user1.address);
    expect(balanceBefore.toNumber()).to.equal(0);

    await contract.mintOne(user1.address);

    const balanceAfter = await contract.balanceOf(user1.address);
    expect(balanceAfter.toNumber()).to.equal(1);
  });
});
