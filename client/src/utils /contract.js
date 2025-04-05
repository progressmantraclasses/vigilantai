import IncidentReportingContract from '../build/contracts/IncidentReportRegistry.json';

const getContract = async (web3) => {
  try {
    // Get the network ID
    const networkId = await web3.eth.net.getId();
    
    // Get the deployed contract data from the build artifact
    const deployedNetwork = IncidentReportingContract.networks[networkId];
    
    if (!deployedNetwork) {
      throw new Error('Contract not deployed to detected network');
    }
    
    // Create the contract instance
    const instance = new web3.eth.Contract(
      IncidentReportingContract.abi,
      deployedNetwork.address
    );
    
    return { instance };
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
};

export default getContract;
