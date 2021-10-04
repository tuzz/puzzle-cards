const config = require("../hardhat.config.js");
const network = hardhatArguments.network;
const metadata = config.networks[network];
const proxyAddress = metadata.openseaProxyAddress;

async function main() {
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("PuzzleCard");

  const contract = await factory.deploy(proxyAddress || owner.address);
  console.log(`Contract address: ${contract.address}`);

  const transaction = await contract.gift(100, owner.address, { gasLimit: 20000000 });
  console.log(`Gift transaction: ${transaction.hash}`);
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
