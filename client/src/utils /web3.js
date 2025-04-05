// src/utils/web3.js
import Web3 from 'web3';

let web3;

const getWeb3 = () => {
  return new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing
    window.addEventListener("load", async () => {
      // Modern dapp browsers
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
          // Request account access
          await window.ethereum.request({ method: "eth_requestAccounts" });
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers
      else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost/Ganache
      else {
        const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
        web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3);
      }
    });
  });
};

export default getWeb3;
