const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Recall Contract", function () {
  async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const RecallToken = await ethers.getContractFactory("RecallToken");
    const [owner, manufacturer1, manufacturer2, manufacturer3, customer1, customer2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // its deployed() method, which happens once its transaction has been
    // mined.
    const recallToken = await RecallToken.deploy("ipfs://1234");

    await recallToken.deployed();
    const mintedToken =  await recallToken.mint(owner.address, 0, 1, 0x0)

    // Fixtures can return anything you consider useful for your tests
    return { RecallToken, recallToken, owner, manufacturer1, manufacturer2, manufacturer3, customer1, customer2 };
  }

  describe("Contract Deploy",  function () {
    it("Deployment should succeed and mint a token to the owner", async function () {
      const { RecallToken, recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
        deployTokenFixture
      );
      const ownerBalance = await recallToken.balanceOf(owner.address, 0);

      expect(1).to.equal(ownerBalance);
    });

    it("transfers token to new address", async function () {
      const { RecallToken, recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
        deployTokenFixture
      );

      await recallToken.transferRecallToken(manufacturer1.address, 0, 1, 0x0, true);
      const ownerBalance = await recallToken.balanceOf(owner.address, 0);
      const manufacturer1Balance = await recallToken.balanceOf(manufacturer1.address, 0);
      expect(ownerBalance).to.equal(0);
      expect(manufacturer1Balance).to.equal(1);
    });

    it("it records the manufacturer", async function () {
      const { RecallToken, recallToken , owner, manufacturer1, manufacturer2, customer1, customer2 } = await loadFixture(
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
      const { RecallToken, recallToken , owner, manufacturer1, manufacturer2, manufacturer3, customer1, customer2 } = await loadFixture(
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

      await recallToken.connect(manufacturer1).checkToken(0, 3);
      const tokenState = await recallToken.connect(manufacturer1).getManufacturerTokenCheckingStateValue(manufacturer1.address, 0);
      await expect(tokenState).to.equal(3);

      await expect(recallToken.connect(manufacturer1).checkToken(0, 2)).to.be.revertedWith("Token can not be checked");

      const productionValue = await recallToken.getInProductionValue(0);
      expect(productionValue).to.equal(true);
      const manuTokenCheckingStateValue = await recallToken.getManufacturerTokenCheckingStateValue(manufacturer1.address, 0);
      expect(manuTokenCheckingStateValue).to.equal(3);
      const tokenCheckingStateValue = await recallToken.getTokenCheckingState(0);
      expect(tokenCheckingStateValue).to.equal(0);
      const getTokenStateValue = await recallToken.getTokenStateValue(0);
      expect(getTokenStateValue).to.equal(1);

      const mintedToken =  await recallToken.mint(owner.address, 1, 1, 0x0);
      await recallToken.transferRecallToken(manufacturer3.address, 1, 1, 0x0, true);
      await recallToken.connect(manufacturer3).transferRecallToken(manufacturer3.address, 1, 1, 0x0, true);

      const manufacturersToken0 = await recallToken.getManufacturersOfToken(0);
      const manufacturersToken1 = await recallToken.getManufacturersOfToken(1);

      expect(manufacturersToken0).to.eql([owner.address, manufacturer1.address, manufacturer2.address]);
      expect(manufacturersToken1).to.eql([owner.address, manufacturer3.address]);

      await expect(recallToken.connect(manufacturer2).mergeToken(0, 1)).to.be.revertedWith("No Token owned");

      await recallToken.connect(customer1).transferRecallToken(manufacturer2.address, 0, 1, 0x0, false);

      await expect(recallToken.connect(manufacturer2).mergeToken(0, 1)).to.emit(recallToken, "TokenMerged").withArgs(owner.address, 0, 1, [owner.address, manufacturer1.address, manufacturer2.address, manufacturer3.address]);
      const manufacturersToken0_1 = await recallToken.getManufacturersOfToken(0);
      expect(manufacturersToken0_1).to.eql([owner.address, manufacturer1.address, manufacturer2.address, manufacturer3.address]);
    });
  })
});