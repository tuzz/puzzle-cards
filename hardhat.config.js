require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("hardhat-abi-exporter");

const PuzzleCard = require("./public/PuzzleCard");
const liveProxyAddress = PuzzleCard.PROXY_REGISTRY_ADDRESS;

const system = (command) => require("child_process").execSync(command).toString().trim();

const privateKey = system("gpg --decrypt ~/Dropbox/Secrets/metamask/private-key.gpg 2>/dev/null");
const apiKey = system("gpg --decrypt ~/Dropbox/Secrets/polygonscan/api-key.gpg 2>/dev/null");

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000,
      },
    },
  },
  paths: {
    artifacts: "./.artifacts",
    cache: "./.cache",
  },
  abiExporter: {
    path: './.abi',
    only: ["PuzzleCard"],
    flat: true,
    pretty: true,
  },
  networks: {
    hardhat: {
      name: "hardhat",
      allowUnlimitedContractSize: true,
      accounts: {
        accountsBalance: "1000000000000000000000000", // 1 million ETH
      },
    },
    test: {
      name: "Polygon Test Network",
      url: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      symbol: "MATIC",
      explorer: "https://mumbai.polygonscan.com",
      openseaProxyAddress: "0xff7ca10af37178bdd056628ef42fd7f799fac77c",
      accounts: [`0x${privateKey}`],
    },
    live: {
      name: "Polygon Mainnet",
      url: "https://rpc-mainnet.maticvigil.com",
      chainId: 137,
      symbol: "MATIC",
      explorer: "https://polygonscan.com",
      openseaProxyAddress: "0x58807bad0b376efc12f5ad86aac70e78ed67deae",
      accounts: [`0x${privateKey}`],
      polygonscanApiKey: apiKey,
    },
  },
  etherscan: {
    apiKey,
  },
  mocha: {
    timeout: 0,
    color: true,
  }
};

const config = require("hardhat/config")
const names = require("hardhat/builtin-tasks/task-names");
const fs = require('fs')

// After compile, copy the exported ABI into a constant in the PuzzleCard.js library.
config.task(names.TASK_COMPILE, async (_taskArguments, _hre, runSuper) => {
  await runSuper();

  const json = fs.readFileSync(".abi/PuzzleCard.json", "utf8").trim();
  const js = fs.readFileSync("public/PuzzleCard.js", "utf8");

  const replaced = js.replaceAll(/CONTRACT_ABI = \[[\s\S]*\]/g, `CONTRACT_ABI = ${json}`);
  fs.writeFileSync("public/PuzzleCard.js", replaced);
});
