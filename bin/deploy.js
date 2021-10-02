async function main() {
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("PuzzleCard");
  const contract = await factory.deploy(owner.address);

  console.log(`Contract address: ${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
