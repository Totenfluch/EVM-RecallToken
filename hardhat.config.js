/** @type import('hardhat/config').HardhatUserConfig */

require("@nomicfoundation/hardhat-toolbox");
require("hardhat-tracer");
require("hardhat-gui");
require("@nomiclabs/hardhat-etherscan");

require('dotenv').config();

module.exports = {
  solidity: "0.8.18",
  networks: {
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.POLYGON_MUMBAI_PRIVATE_KEY]
    }
  },
  apiKey: process.env.ETHERSCAN_API_KEY
};
