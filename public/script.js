const provider = new ethers.providers.Web3Provider(ethereum);
const signer = provider.getSigner();

PuzzleCard.attach(ethers, provider);
PuzzleCard.connect(signer);

signer.getAddress().then(address => {
  PuzzleCard.mint(100, address).then(cards => {
    console.log(cards, cards[0].tokenID());
  });
});
