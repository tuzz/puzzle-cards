ethereum.request({ method: "eth_requestAccounts" });

const provider = new ethers.providers.Web3Provider(ethereum);
const signer = provider.getSigner();

PuzzleCard.attach(ethers, provider);
PuzzleCard.connect(signer);

signer.getAddress().then(address => {
  PuzzleCard.fetchDeck(address, console.log).then(console.log);
});
