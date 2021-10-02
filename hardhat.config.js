require("@nomiclabs/hardhat-ethers");

const system = (command) => require("child_process").execSync(command).toString().trim();

const rinkebyUrl = system("gpg --decrypt ~/Dropbox/Secrets/alchemy/api-key-url.gpg 2>/dev/null");
const privateKey = system("gpg --decrypt ~/Dropbox/Secrets/metamask/private-key.gpg 2>/dev/null");

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: { url: rinkebyUrl, accounts: [`0x${privateKey}`] }
  },
};
