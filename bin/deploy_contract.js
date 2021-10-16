const fs = require("fs")
const config = require("../hardhat.config.js");
const network = hardhatArguments.network;
const metadata = config.networks[network];
const proxyAddress = metadata.openseaProxyAddress;

const main = async () => {
  let blockNumber = (await ethers.provider.getBlock("latest")).number;

  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("PuzzleCard");

  const contract = await factory.deploy(proxyAddress || owner.address);
  console.log(`Contract address: ${contract.address}`);

  const transaction = await contract.gift(400, owner.address, { gasLimit: 20000000 });
  console.log(`Gift transaction: ${transaction.hash}`);

  while (true) {
    const block = await ethers.provider.getBlock(blockNumber);

    if (block && block.transactions.indexOf(contract.deployTransaction.hash) !== -1) {
      console.log(`Contract block number: ${blockNumber}`);
      break;
    } else if (block) {
      blockNumber += 1;
    }
  }

  updateConstants("public/PuzzleCard.js", contract.address, blockNumber);
}

const updateConstants = (filename, contractAddress, blockNumber) => {
  const content = fs.readFileSync(filename, "utf8")
    .replaceAll(/CONTRACT_ADDRESS = .*;/g, `CONTRACT_ADDRESS = "${contractAddress}";`)
    .replaceAll(/CONTRACT_BLOCK = .*;/g, `CONTRACT_BLOCK = ${blockNumber};`)

  fs.writeFileSync(filename, content);
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
