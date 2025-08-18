// routes/account.routes.js

const express = require('express');
const { fetchTop5kAccounts,
    fetchTop10kAccounts,
    fetchTop25kAccounts,
    fetchTop50kAccounts,
    fetchTop100kAccounts,
    fetchTop200kAccounts,
    fetchTop10kAccountsTwoStep,
    fetchTop25kAccountsTwoStep,
    fetchTop50kAccountsTwoStep,
    fetchTop100kAccountsTwoStep,
    fetchTop200kAccountsTwoStep,
    fetchTop300kAccountsTwoStep,
    fetchTop300kAccounts } = require('./leaderBoard.controller');
const router = express.Router();


// Define the route to fetch the top 5k accounts
router.get('/leaderboardOf5k', fetchTop5kAccounts);
router.get('/leaderboardOf10k', fetchTop10kAccounts);
router.get('/leaderboardOf25k', fetchTop25kAccounts);
router.get('/leaderboardOf50k', fetchTop50kAccounts);
router.get('/leaderboardOf100k', fetchTop100kAccounts);
router.get('/leaderboardOf200k', fetchTop200kAccounts);
router.get('/leaderboardOf300k', fetchTop300kAccounts);

// Define the route to fetch the top 20 accounts for two step challenges
router.get('/leaderboardOf10kTwoStep', fetchTop10kAccountsTwoStep);
router.get('/leaderboardOf25kTwoStep', fetchTop25kAccountsTwoStep);
router.get('/leaderboardOf50kTwoStep', fetchTop50kAccountsTwoStep);
router.get('/leaderboardOf100kTwoStep', fetchTop100kAccountsTwoStep);
router.get('/leaderboardOf200kTwoStep', fetchTop200kAccountsTwoStep);
router.get('/leaderboardOf300kTwoStep', fetchTop300kAccountsTwoStep);

module.exports = router