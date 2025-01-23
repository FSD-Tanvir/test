const MContract = require("./contract.schema");

const uploadContractServices = async (data)=>{

    try {
    const file = new MContract(data);
    await file.save();
    return file;
    } catch (error) {
       return error; 
    }
}

const updateContractStatus = async (fileId, status) =>{
  const allowedStatuses = ['pending', 'approved', 'declined'];
  
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const updatedContract = await MContract.findOneAndUpdate(
    { fileId },
    { status },
    { new: true }
  );

  if (!updatedContract) {
    throw new Error('Contract not found');
  }

  return updatedContract;
}

const getAllContractServicesWithEmail = async (email) => {
    const contracts = await MContract.find({ email });
    return contracts;
}


module.exports ={
    uploadContractServices,
    updateContractStatus,
    getAllContractServicesWithEmail
}