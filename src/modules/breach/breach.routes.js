const express = require("express");
const { getUserStoredDataController, getUserStoredDataControllersAll,deleteAccountDataController,getAllAccounts,deleteDisableAccountById } = require("./breach.controller");

const router = express.Router();

router.get("/userStoredData/:mt5Account", getUserStoredDataController);
router.get("/all/userStoredData/:mt5Account", getUserStoredDataControllersAll);



router.get("/all-accounts", getAllAccounts);

router.delete("/disable-account/:id", deleteDisableAccountById);

// New route to delete specific account data on a specific date
router.delete("/delete-account/:mt5Account", deleteAccountDataController);

module.exports = router;
