const Metamask = {};

Metamask.actionsThatCanBeTaken = async (PuzzleCard, cards, address, preSwitchCallback = () => {}) => {
  // If the user isn't connect the the only action they can take is to (re)connect.
  if (!await Metamask.alreadyConnected(PuzzleCard)) {
    return [address ? "reconnectToMetamask" : "connectToMetamask"];
  }

  if (cards.filter(c => c).length < 2) { return []; }
  if (typeof ethereum === "undefined") { return []; }

  // Give the calling code the opportunity to run something before the switch
  // network prompt appears. Otherwise, it blocks until that resolves / rejects.
  if (!await Metamask.alreadyCorrectNetwork(PuzzleCard)) { preSwitchCallback(); }

  // If we aren't connected yet, the metamask button's action should be to
  // connect so we don't need to try and check if any actions can be taken.

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

Metamask.performActionOnStacks = async (PuzzleCard, actionName, cardStacks) => {
  Metamask.tryAgain = false;

  if (typeof ethereum === "undefined") {
    alert("Please install the MetaMask browser extension to use this website.");
    return [];
  }

  const oneOfEachCard = cardStacks.map(c => c.card);
  const minQuantity = Math.min(...cardStacks.map(s => s.quantity));
  const quantityTimes = [...Array(minQuantity).keys()];

  if (!actionName.match(/connectToMetamask/) && await Metamask.alreadyConnected(PuzzleCard) && await Metamask.alreadyCorrectNetwork(PuzzleCard)) {
    return quantityTimes.map(() => PuzzleCard.call(actionName, oneOfEachCard, true));
  }

  // Only allow the page to reload if the user won't lose the positions of their cards.
  // The 'reconnectToMetamask' action doesn't reload because they might have moved cards.
  const isOkToReload = actionName === "connectToMetamask";

  if (isOkToReload && await Metamask.ensureConnectedOrReloadPageToShowPromptAgain()) {
    return [];
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
    return [];
  } else if (Metamask.tryAgain) {
    return [];
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
    return [];
  } else if (Metamask.tryAgain) {
    return [];
  }

  // If they got this far, they managed to connect but this isn't a PuzzleCard action.
  if (actionName === "reconnectToMetamask") { return [] }

  // Initiate the requests immediately after connect/switching since a popup will be shown.
  return quantityTimes.map(() => PuzzleCard.call(actionName, oneOfEachCard, true));
};

Metamask.alreadyConnected = async (PuzzleCard) => {
  if (!PuzzleCard.CONTRACT) { return false; }

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
