const provider = new ethers.providers.Web3Provider(window.ethereum);

PuzzleCard.attach(ethers, provider);
PuzzleCard.pricePerCard().then(console.log);
