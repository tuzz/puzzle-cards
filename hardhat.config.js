require("@nomiclabs/hardhat-ethers");
require("hardhat-contract-sizer");

const system = (command) => require("child_process").execSync(command).toString().trim();
const privateKey = system("gpg --decrypt ~/Dropbox/Secrets/metamask/private-key.gpg 2>/dev/null");
const u32MaxValue = Math.pow(2, 32) - 1;

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: u32MaxValue,
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        accountsBalance: "1000000000000000000000000", // 1 million ETH
      },
    },
    test: {
      url: "https://rpc-mumbai.maticvigil.com",
      openseaProxyAddress: "0xff7ca10af37178bdd056628ef42fd7f799fac77c",
      accounts: [`0x${privateKey}`],
    },
    live: {
      url: "https://rpc-mainnet.maticvigil.com",
      openseaProxyAddress: "0x58807bad0b376efc12f5ad86aac70e78ed67deae",
      accounts: [`0x${privateKey}`],
    },
  },
  mocha: {
    timeout: 0,
    color: true,
  }
};
