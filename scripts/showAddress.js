module.exports = async function(callback) {
  try {
    const Crowdfunding = artifacts.require("Crowdfunding");
    const instance = await Crowdfunding.deployed();
    console.log('Crowdfunding deployed at:', instance.address);
  } catch (err) {
    console.error(err);
  }
  callback();
};
