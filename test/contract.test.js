const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Contract Test", function () {
    let RecallToken;
    let [owner, manufacturer1, manufacturer2, manufacturer3, customer1, customer2] = [];
    let recallToken;
    it("Deployment should succeed and mint a token to the owner", async function () {
        // Get the ContractFactory and Signers here.
        RecallToken = await ethers.getContractFactory("RecallToken");
        [owner, manufacturer1, manufacturer2, manufacturer3, customer1, customer2] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // its deployed() method, which happens once its transaction has been
        // mined.
        recallToken = await RecallToken.deploy("ipfs://1234");

        await recallToken.deployed();
        expect(recallToken).to.not.be.undefined;
    });

    it("Should mint a token", async function () {
        await recallToken.mint(owner.address, 0, 1, 0x0);
        const ownerBalance = await recallToken.balanceOf(owner.address, 0);
        expect(1).to.equal(ownerBalance);
    });

    it("transfers token to new address", async function () {
        await recallToken.transferRecallToken(manufacturer1.address, 0, 1, 0x0, true);
        const ownerBalance = await recallToken.balanceOf(owner.address, 0);
        const manufacturer1Balance = await recallToken.balanceOf(manufacturer1.address, 0);
        expect(ownerBalance).to.equal(0);
        expect(manufacturer1Balance).to.equal(1);
    });

    it("records the balance of the manufacturers", async function () {  
        await recallToken.connect(manufacturer1).transferRecallToken(manufacturer2.address, 0, 1, 0x0, true);
        const manufacturer1aBalance = await recallToken.balanceOf(manufacturer1.address, 0);
        const manufacturer2aBalance = await recallToken.balanceOf(manufacturer2.address, 0);
  
        expect(manufacturer1aBalance).to.equal(0);
        expect(manufacturer2aBalance).to.equal(1);
      });

      it("emits AnnounceDefect", async function () {
        await recallToken.connect(manufacturer2).transferRecallToken(customer1.address, 0, 1, 0x0, false);
        await expect(recallToken.connect(customer1).announceDefect(0)).to.emit(recallToken, "DefectAnnounced").withArgs(customer1.address, 0);
      });

      it("gets the correct checking state and fails to check without permissions", async function () {
        await recallToken.connect(manufacturer1).checkToken(0, 3);
        const tokenState = await recallToken.connect(manufacturer1).getManufacturerTokenCheckingStateValue(manufacturer1.address, 0);
        await expect(tokenState).to.equal(3);
  
        await expect(recallToken.connect(manufacturer1).checkToken(0, 2)).to.be.revertedWith("Token can not be checked");
      });

      it("has the correct token values", async function () {
        const productionValue = await recallToken.getInProductionValue(0);
        expect(productionValue).to.equal(true);
        const manuTokenCheckingStateValue = await recallToken.getManufacturerTokenCheckingStateValue(manufacturer1.address, 0);
        expect(manuTokenCheckingStateValue).to.equal(3);
        const tokenCheckingStateValue = await recallToken.getTokenCheckingState(0);
        expect(tokenCheckingStateValue).to.equal(0);
        const getTokenStateValue = await recallToken.getTokenStateValue(0);
        expect(getTokenStateValue).to.equal(1);
      });

      it("has to correct manufacturer list", async function () {
        const mintedToken =  await recallToken.mint(owner.address, 1, 1, 0x0);
        await recallToken.transferRecallToken(manufacturer3.address, 1, 1, 0x0, true);
        await recallToken.connect(manufacturer3).transferRecallToken(manufacturer3.address, 1, 1, 0x0, true);
  
        const manufacturersToken0 = await recallToken.getManufacturersOfToken(0);
        const manufacturersToken1 = await recallToken.getManufacturersOfToken(1);

        expect(manufacturersToken0).to.eql([owner.address, manufacturer1.address, manufacturer2.address]);
        expect(manufacturersToken1).to.eql([owner.address, manufacturer3.address]);
      });

      it("fails to merge token without correct permissions", async function () {
        await expect(recallToken.connect(manufacturer2).mergeToken(0, 1)).to.be.revertedWith("No Token owned");
      });

      it("merges the tokens correctly", async function () {
        await recallToken.connect(customer1).transferRecallToken(manufacturer2.address, 0, 1, 0x0, false);
  
        await expect(recallToken.connect(manufacturer2).mergeToken(0, 1)).to.emit(recallToken, "TokenMerged");
        const manufacturersToken0_1 = await recallToken.getManufacturersOfToken(0);
        expect(manufacturersToken0_1).to.eql([owner.address, manufacturer1.address, manufacturer2.address, manufacturer3.address]);
      });

      it("fails to forwardRecall without correct permissions", async function () {
        await expect(recallToken.connect(customer1).forwardRecall([0, 1])).to.be.revertedWith("Not a Manufacturer of this Token");
      });

      it("executes forwardRecall properly", async function () {
        const mintedToken =  await recallToken.mint(owner.address, 2, 1, 0x0);
        await recallToken.transferRecallToken(manufacturer3.address, 2, 1, 0x0, true);
        await recallToken.connect(manufacturer3).transferRecallToken(manufacturer3.address, 2, 1, 0x0, true);

        await recallToken.connect(manufacturer3).forwardRecall([1, 2]);
        const recallStatusToken1 = await recallToken.getTokenStateValue(1);
        const recallStatusToken2 = await recallToken.getTokenStateValue(2);
        expect(recallStatusToken1).to.equal(2);
        expect(recallStatusToken2).to.equal(2);
      });
});