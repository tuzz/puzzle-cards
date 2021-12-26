const PuzzleCard = require("../public/PuzzleCard");

const main = async () => {
  const [owner] = await ethers.getSigners();

  PuzzleCard.attach(ethers, ethers.provider);
  PuzzleCard.connect(owner);

  for (let address of addresses) {
    await PuzzleCard.mint(100, "Mortal", address);
    const balance = await ethers.provider.getBalance(PuzzleCard.CONTRACT_OWNER);

    console.log(`Gifted to ${address}, remaining balance: ${balance}`);
  }
}

const addresses = [
  "0x0a3d548c13daada0e1b18251f03f7bc45424c2a3",
  "0xc67463188373688603c2bd0e912d234dcdd7227d",
  "0xd0aa789dd795521cdad8b71b429c1db85af96dbd",
  "0x08181f7c7fc7b06a5f88f4a400f00dc4b3f1cea8",
  "0x9157304d83686b068fedcf29c3052930d4e4c59b",
  "0x8e795fbf30df6a919a7bbc767c9f0b437072a064",
  "0x6fdd961237a592f8f92610fd0fc1f6cf4f47830f",
  "0x466c97292bac70bb0221179a4421d99ce012b3ae",
  "0x676b9666a1a5e5c13da7af82ea9bdfcefbcad15d",
  "0x3e60cd8beadad9a6e1e492117c0618ab8a0d28b0",
  "0xd727927518184d31e3c6d6c70ef5566441b727c7",
  "0x6b8743fc3c2a252ea3f5a2921e82ef23a4bf34f5",
  "0xf0043ea0325be97eae2dfdfd34166e5b7ef293e5",
  "0xb89630728fba2686e5c82b6412a841aae3234058",
  "0x4a515a1a37f24251adeadbdf6c8def21b4d3ab40",
  "0x9ac3639876aded0c8165414cf998a63b66890f9d",
  "0x875b8dfa5d092669c1c6d416a4e3a5dbc32fa47f",
  "0x53681565c494ab660f4b508b9cbf370577765851",
  "0xc865a9bfed31206e6ae84a6dafb31854ca32ca86",
  "0x3c9a2cdae7f1bb0cb5dbeb696b0c0ad428800ace",
  "0x137f15fdf525a24dc27f7d656643ecc32e39f652",
  "0x73c10d9bb5a9c2a4797d81c4bfa4df6c370c0e7c",
  "0x567c39adc4d6ae8f1bee17f122ef11c05650ceb4",
  "0xc6e4e91d6e9eeb95a6069d78c77bc88bf0d67519",
  "0xf08b1db0dbc2b8846bf2956ed0e6d448c6c90e5f",
  "0xd2348ed7914f348ed50a4b276b771debd5699d41",
  "0xbabce25516996f98164394f251b633a011ae2187",
  "0x795fdbeb644f867c064dd4d796ec2c88e4020af8",
  "0x22def93928563d3fda5c705faed9dc20fa998981",
  "0xa2d84ec497e904937fb68ef87dfac8baa672f116",
  "0x43295629740e06d4de9bd4135dbb0b7d2a08ed83",
  "0x008ec4be2608d657ff966a104895803cee175f4e",
  "0x2e778bed93fafad50ebab875425bef037e988a9f",
  "0x88e01261a69fbaa35102918a479f6ff3db4f1438",
  "0x66b1912c55f3a6564e182bcaffcac194ba9b95ec",
  "0xb9445d080bcdd43cec0889026d33894170fb1e4c",
  "0x18a6f239e133b04a7089a280bf48cc84ccca0622",
  "0x984d109c2f05537ca799b59ce5142579eda70589",
  "0xd197879b324d14f7f70f44907b2f6b7561f46d80",
  "0xe4d63726b194359f2b68da4382bd9ddc93fc06fe",
  "0xb65c1b84fe617bc1a406d4fcb4efa2faccfa863e",
  "0xde9088ee5484f28e45f4f848986ada30e6382570",
  "0xeefe27c922dccf57d759d6ea48300ba53a06d341",
  "0x3682df1ffe278d47c0290777c8767822a2766c2d",
  "0xf12e9573f5ceee8bed693c8db88420fb8170a81d",
  "0x9eaebaa809550d2ff7596fa59c22538e111cce8f",
  "0x77b669f2ced6b9b6cf2116e01e6d8eb173e1085e",
  "0xae99439c57be527089579a24b1cdbcc1fe354569",
  "0xa4c56b6e747ad6efeec98fa0bb2f57ef90a54cbe",
  "0x3bf319d7d6f6c21ae3f3ca76e379bbb1ccbfc3b4",
  "0xfd0b889c1b6200796fe08b12b879e50d619640b0",
]

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
