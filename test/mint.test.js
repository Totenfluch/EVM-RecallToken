const { expect } = require("chai");
const ethers = require('ethers');

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();

    const RecallToken = await ethers.getContractFactory("erc5555");

    const recallToken = await RecallToken.deploy();

    const mintedToken =  await recallToken.mint(owner.address, 0, 1, 0x0)
    const ownerBalance = await recallToken.balanceOf(owner.address, 0);

    expect(1).to.equal(ownerBalance);
  });
});