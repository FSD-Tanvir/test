// controllers/affiliate.controller.js
const affiliateService = require("./affiliate.services.js");
const {
  generateReferralCode,
  createReferralLink,
} = require("../../helper/autoGenerator.js");

const createAffiliate = async (req, res) => {
  const affiliateData = req.body;
  if (!affiliateData.email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const referralCode = generateReferralCode();
  affiliateData.referralCode = referralCode;
  affiliateData.referralLink = createReferralLink(referralCode);

  try {
    const affiliate = await affiliateService.createAffiliate(affiliateData);
    res.status(201).json(affiliate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAffiliateDataHandler = async (req, res) => {
  const { email } = req.params;

  try {
    const affiliate = await affiliateService.getAffiliateData(email);
    res.status(201).json(affiliate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllAffiliatesHandler = async (req, res) => {
  try {
    const affiliate = await affiliateService.getAllAffiliates();
    res.status(201).json(affiliate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const getAllAffiliatesApprovedHandler = async (req, res) => {
  try {
    const affiliate = await affiliateService.getAllApprovedAffiliates();
    res.status(201).json(affiliate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// const updateAffiliateHandler = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const affiliate = await affiliateService.updateAffiliate(id, req.body);
//     res.status(201).json(affiliate);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// Controller to get an affiliate by referral code
const getAffiliate = async (req, res) => {
  const { referralCode } = req.params;
  try {
    const affiliate = await affiliateService.getAffiliateByReferralCode(
      referralCode
    );
    res.status(200).json({
      success: true,
      data: affiliate,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getAffiliateById = async (req, res) => {
  const { id } = req.params;
  try {
    const affiliate = await affiliateService.getAffiliateById(id);
    if (!affiliate) {
      return res.status(404).json({ message: "Affiliate not found." });
    }
    res.status(200).json(affiliate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createAffiliate,
  getAffiliateDataHandler,
  getAllAffiliatesHandler,
  getAffiliate,
  getAllAffiliatesApprovedHandler,
  getAffiliateById
};
