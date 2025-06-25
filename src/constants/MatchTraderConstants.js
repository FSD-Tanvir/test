const groupNames = {
	phase1: "phase1",
	phase2: "phase2",
	funded: "funded",
	passed: "passed",
	breached: "breached",
};

const accountDisableDetails = {
	access: "TRADING_DISABLED",
};

//! ⚠️⚠️ TODO: TO BE REPLACED WHEN CREDENTIALS ARE AVAILABLE

const phase1OfferUUID = "53434e1c-1919-4ee5-b04c-ab09db22b902";
const phase2OfferUUID = "455a77ec-8709-4152-a46d-5680c008e86c";
// const fundedOfferUUID = "53434e1c-1919-4ee5-b04c-ab09db22b902";
const fundedOfferUUID = "141a0f7f-ad96-43e2-a0b4-235e6738247a";// Real UUID for funded offer
const offerUUIDConstants = {
	phase1: phase1OfferUUID,
	phase2: phase2OfferUUID,
	funded: fundedOfferUUID,
};

module.exports = {
	groupNames,
	accountDisableDetails,
	offerUUIDConstants,
};
