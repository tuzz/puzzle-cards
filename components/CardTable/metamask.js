const Metamask = {};

Metamask.performAction = async (PuzzleCard, actionName, cards) => {
  console.log(actionName);
  if (typeof ethereum === "undefined") {
    alert("Please install the MetaMask browser extension to use this website.");
    return false;
  }

  if (!await Metamask.ensureCorrectNetwork(PuzzleCard)) {
    alert("Please switch to the Polygon network to use this website.");
    return false;
  }

  if (actionName === "connectToMetamask") {
    return await Metamask.connectOrReloadAndConnect();
  }

  return PuzzleCard[actionName](cards).then(() => true).catch(() => false);
}

Metamask.connectOrReloadAndConnect = async () => {
  try {
    await ethereum.request({ method: "eth_requestAccounts" });
    return true;
  } catch (error) {
    const message = error.message || "";
    if (!message.match(/already processing/i)) { throw error; }

    const href = window.location.href;
    if (href.match(/connectOnLoad/)) { window.location.reload(); return; }

    const delimiter = href.match(/\?/) ? "&" : "?";
    window.location.href += delimiter + "connectOnLoad=true";

    return false; // Kind of unreachable because the page reloads.
  }
};

Metamask.ensureCorrectNetwork = async (PuzzleCard) => {
  const expectedNetwork = PuzzleCard.CONTRACT_NETWORK;
  const actualNetwork = await PuzzleCard.CONTRACT.provider.getNetwork();

  if (actualNetwork.chainId === expectedNetwork.chainId) { return true; }

  await ethereum.request({ method: "wallet_addEthereumChain", params: [{
    chainName: expectedNetwork.name,
    chainId: "0x" + expectedNetwork.chainId.toString(16),
    rpcUrls: [expectedNetwork.url],
    nativeCurrency: { symbol: expectedNetwork.symbol, decimals: 18 },
    blockExplorerUrls: [expectedNetwork.explorer],
  }] });
}

export default Metamask;
