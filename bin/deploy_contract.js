const fs = require("fs")
const config = require("../hardhat.config");
const network = hardhatArguments.network;
const metadata = config.networks[network];

const main = async () => {
  let blockNumber = (await ethers.provider.getBlock("latest")).number;

  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("PuzzleCard");

  const proxyAddress = metadata.openseaProxyAddress || owner.address;
  const contract = await factory.deploy(proxyAddress);
  console.log(`Contract address: ${contract.address}`);

  const transaction = await contract.gift(400, 0, owner.address, { gasLimit: 20000000 });
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

  updateConstants("public/PuzzleCard.js", contract.address, blockNumber, proxyAddress);
};

const updateConstants = (filename, contractAddress, blockNumber, proxyAddress) => {
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
    .replaceAll(/CONTRACT_BLOCK = .*;/g, `CONTRACT_BLOCK = ${blockNumber};`)
    .replaceAll(/PROXY_REGISTRY_ADDRESS = .*;/g, `PROXY_REGISTRY_ADDRESS = "${proxyAddress}";`);

  fs.writeFileSync(filename, content);
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
