const Metamask = {};

Metamask.actionsThatCanBeTaken = async (PuzzleCard, cards) => {
  if (cards.filter(c => c).length < 2) { return []; }
  if (typeof ethereum === "undefined") { return []; }

  // If we aren't connected yet, the metamask button's action should be to
  // connect so we don't need to try and check if any actions can be taken.
  if (!await Metamask.alreadyConnected(PuzzleCard)) { return []; }

  // This follows the same pattern as in the method below. See for explanation.
  const managedToSwitch = await Metamask.switchNetwork(PuzzleCard);

  if (!managedToSwitch) {
    if (Metamask.promptingToSwitch) {
      alert("Please allow MetaMask to switch network.")
    }
    Metamask.tryAgain = true;
    return [];
  } else if (!managedToSwitch && Metamask.tryAgain) {
    return [];
  }

  return PuzzleCard.actionsThatCanBeTaken(cards);
};

// Returns an array containing two elements:
//   0: whether the action was initiated on the network
//   1: a promise that will return whether the action was successful
// TODO: make this method support cardStacks and return success if *any* of the
// promises succeeds - this is so that the user can choose how many to combine.
Metamask.performAction = async (PuzzleCard, actionName, cards) => {
  Metamask.tryAgain = false;

  if (typeof ethereum === "undefined") {
    alert("Please install the MetaMask browser extension to use this website.");
    return [false, false];
  }

  if (actionName !== "connectToMetamask" && await Metamask.alreadyConnected(PuzzleCard) && await Metamask.alreadyCorrectNetwork(PuzzleCard)) {
    return [true, PuzzleCard[actionName](cards).then(() => true).catch(() => false)];
  }

  // Only allow the page to reload if the user won't lose the positions of their cards.
  const isOkToReload = actionName === "connectToMetamask";

  if (isOkToReload && await Metamask.ensureConnectedOrReloadPageToShowPromptAgain()) {
    return [true, true];
  }

  // This will fail if there is already a prompt to connect that the user hasn't yet accepted.
  const managedToConnect = await Metamask.connect();

  // Prompt the user to first accept the original prompt then press the button
  // again to reinitiate the request. Otherwise, no popup is created for the
  // request and it's confusing to the user that there's an Unnapproved request
  // sitting in MetaMask that they would need to accept. Even with this flow,
  // MetaMask still prompts the user to log in a second time after pressing on
  // the button which is annoying but at least it's obvious what to do.
  if (!managedToConnect) {
    alert("Please unlock MetaMask then press the button again.");
    Metamask.tryAgain = true;
    return [false, false]
  } else if (Metamask.tryAgain) {
    return [false, false];
  }

  // This follows the same pattern as above. The slight difference is that we
  // should only show the alert when the switch network promise is unresolved.
  // We don't want to show it if the user just cancels because then it's apparent
  // when the action wasn't performed. We don't need to do this check for
  // connecting because there's no cancel button on the MetaMask unlock screen.
  const managedToSwitch = await Metamask.switchNetwork(PuzzleCard);

  if (!managedToSwitch) {
    if (Metamask.promptingToSwitch) {
      alert("Please allow MetaMask to switch network then press the button again.");
    }
    Metamask.tryAgain = true;
    return [false, false]
  } else if (Metamask.tryAgain) {
    return [false, false];
  }

  // Initiate the request immediate after connect/switching since a popup will be shown.
  return [true, PuzzleCard[actionName](cards).then(() => true).catch(() => false)];
};

Metamask.alreadyConnected = async (PuzzleCard) => {
  const address = await PuzzleCard.CONTRACT.signer.getAddress().catch(() => {});
  return !!address;
};

Metamask.connect = async () => {
  try {
    await ethereum.request({ method: "eth_requestAccounts" });
    return true;
  } catch (error) {
    return false;
  }
};

Metamask.ensureConnectedOrReloadPageToShowPromptAgain = async () => {
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

    return true; // Kind of unreachable because the page reloads.
  }
};

Metamask.alreadyCorrectNetwork = async (PuzzleCard) => {
  const expectedNetwork = PuzzleCard.CONTRACT_NETWORK;
  const actualNetwork = await PuzzleCard.CONTRACT.provider.getNetwork();

  return actualNetwork.chainId === expectedNetwork.chainId;
};

Metamask.switchNetwork = async (PuzzleCard) => {
  const expectedNetwork = PuzzleCard.CONTRACT_NETWORK;

  Metamask.promptingToSwitch = true;

  await ethereum.request({ method: "wallet_addEthereumChain", params: [{
    chainName: expectedNetwork.name,
    chainId: "0x" + expectedNetwork.chainId.toString(16),
    rpcUrls: [expectedNetwork.url],
    nativeCurrency: { symbol: expectedNetwork.symbol, decimals: 18 },
    blockExplorerUrls: [expectedNetwork.explorer],
  }] }).then(() => Metamask.promptingToSwitch = false).catch(() => {});

  const updatedNetwork = await PuzzleCard.CONTRACT.provider.getNetwork();
  return updatedNetwork.chainId == expectedNetwork.chainId;
};

export default Metamask;
