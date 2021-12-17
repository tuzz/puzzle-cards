const fs = require("fs")
const config = require("../hardhat.config");
const network = hardhatArguments.network;
const metadata = config.networks[network];

const main = async () => {
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("PuzzleCard");

  const proxyAddress = metadata.openseaProxyAddress || owner.address;
  const receipt = await factory.deploy(proxyAddress);
  const transaction = await receipt.deployTransaction.wait();

  console.log(`Contract address: ${transaction.contractAddress}`);
  console.log(`Block number: ${transaction.blockNumber}`);

  updateConstants("public/PuzzleCard.js", transaction.contractAddress, owner.address, transaction.blockNumber, proxyAddress);
};

const updateConstants = (filename, contractAddress, ownerAddress, blockNumber, proxyAddress) => {
  const network = {
    name: metadata.name,
    url: metadata.url,
    url2: metadata.url2,
    chainId: metadata.chainId,
    symbol: metadata.symbol,
    explorer: metadata.explorer,
  };

  const content = fs.readFileSync(filename, "utf8")
    .replaceAll(/CONTRACT_NETWORK = .*;/g, `CONTRACT_NETWORK = ${JSON.stringify(network)};`)
    .replaceAll(/CONTRACT_ADDRESS = .*;/g, `CONTRACT_ADDRESS = "${contractAddress.toLowerCase()}";`)
    .replaceAll(/CONTRACT_OWNER = .*;/g, `CONTRACT_OWNER = "${ownerAddress.toLowerCase()}";`)
    .replaceAll(/CONTRACT_BLOCK = .*;/g, `CONTRACT_BLOCK = ${blockNumber};`)
    .replaceAll(/PROXY_REGISTRY_ADDRESS = .*;/g, `PROXY_REGISTRY_ADDRESS = "${proxyAddress}";`);

  fs.writeFileSync(filename, content);
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
