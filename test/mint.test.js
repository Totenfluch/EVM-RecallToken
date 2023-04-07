const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Recall Contract", function () {
  async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const Token = await ethers.getContractFactory("RecallToken");
    const [owner, manufacturer1, manufacturer2, customer1, customer2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // its deployed() method, which happens once its transaction has been
    // mined.
    const recallToken = await Token.deploy("ipfs://1234");

    await recallToken.deployed();
    const mintedToken =  await recallToken.mint(owner.address, 0, 1, 0x0)

    // Fixtures can return anything you consider useful for your tests
    return { Token, recallToken, owner, manufacturer1, manufacturer2, customer1, customer2 };
  }

  describe("Contract Deploy",  function () {
    it("Deployment should succeed and mint a token to the owner", async function () {
      const { recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
        deployTokenFixture
      );
      const ownerBalance = await recallToken.balanceOf(owner.address, 0);

      expect(1).to.equal(ownerBalance);
    });

    it("transfers token to new address", async function () {
      const { recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
        deployTokenFixture
      );

      await recallToken.transferRecallToken(manufacturer1.address, 0, 1, 0x0, true)
      const ownerBalance = await recallToken.balanceOf(owner.address, 0);
      const manufacturer1Balance = await recallToken.balanceOf(manufacturer1.address, 0);
      expect(ownerBalance).to.equal(0);
      expect(manufacturer1Balance).to.equal(1);
    });

    it("it records the manufacturer", async function () {
      const { recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
        deployTokenFixture
      );

      await recallToken.transferRecallToken(manufacturer1.address, 0, 1, 0x0, true)
      const ownerBalance = await recallToken.balanceOf(owner.address, 0);
      const manufacturer1Balance = await recallToken.balanceOf(manufacturer1.address, 0);

      expect(ownerBalance).to.equal(0);
      expect(manufacturer1Balance).to.equal(1);

      await recallToken.connect(manufacturer1).transferRecallToken(manufacturer2.address, 0, 1, 0x0, true);
      const manufacturer1aBalance = await recallToken.balanceOf(manufacturer1.address, 0);
      const manufacturer2aBalance = await recallToken.balanceOf(manufacturer2.address, 0);

      expect(manufacturer1aBalance).to.equal(0);
      expect(manufacturer2aBalance).to.equal(1);
    });

    it("it emits AnnounceDefect", async function () {
      const { recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
        deployTokenFixture
      );

      await recallToken.transferRecallToken(manufacturer1.address, 0, 1, 0x0, true)
      const ownerBalance = await recallToken.balanceOf(owner.address, 0);
      const manufacturer1Balance = await recallToken.balanceOf(manufacturer1.address, 0);

      expect(ownerBalance).to.equal(0);
      expect(manufacturer1Balance).to.equal(1);

      await recallToken.connect(manufacturer1).transferRecallToken(manufacturer2.address, 0, 1, 0x0, true);
      const manufacturer1aBalance = await recallToken.balanceOf(manufacturer1.address, 0);
      const manufacturer2aBalance = await recallToken.balanceOf(manufacturer2.address, 0);

      expect(manufacturer1aBalance).to.equal(0);
      expect(manufacturer2aBalance).to.equal(1);

      await recallToken.connect(manufacturer2).transferRecallToken(customer1.address, 0, 1, 0x0, false);
      await expect(recallToken.connect(customer1).announceDefect(0)).to.emit(recallToken, "DefectAnnounced").withArgs(customer1.address, 0);
    });
  })
});