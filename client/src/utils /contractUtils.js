// src/utils/contractUtils.js
import IncidentReportRegistryContract from '../build/contracts/IncidentReportRegistry.json';

export const getContract = async (web3) => {
  try {
    // Get the network ID
    const networkId = await web3.eth.net.getId();
    
    // Get the deployed contract info for this network
    const deployedNetwork = IncidentReportRegistryContract.networks[networkId];
    
    if (!deployedNetwork) {
      throw new Error(`Contract not deployed on network ID: ${networkId}`);
    }
    
    // Create a new contract instance with the deployed address and ABI
    const instance = new web3.eth.Contract(
      IncidentReportRegistryContract.abi,
      deployedNetwork.address
    );
    
    return { instance, deployedNetwork };
  } catch (error) {
    console.error("Error loading contract:", error);
    throw error;
  }
};
