const fs = require('fs')
const config = require("../hardhat.config.js");
const network = hardhatArguments.network;
const metadata = config.networks[network];
const proxyAddress = metadata.openseaProxyAddress;

const main = async () => {
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("PuzzleCard");

  const contract = await factory.deploy(proxyAddress || owner.address);
  console.log(`Contract address: ${contract.address}`);

  updateConstant("contracts/PuzzleCard.js", contract.address);

  const transaction = await contract.gift(400, owner.address, { gasLimit: 20000000 });
  console.log(`Gift transaction: ${transaction.hash}`);
}

const updateConstant = (filename, newAddress) => {
  const js = fs.readFileSync(filename, "utf8");
  const replaced = js.replaceAll(/CONTRACT_ADDRESS = .*;/g, `CONTRACT_ADDRESS = "${newAddress}";`);

  fs.writeFileSync(filename, replaced);
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
