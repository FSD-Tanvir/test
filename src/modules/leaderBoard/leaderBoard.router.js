// routes/account.routes.js

const express = require('express');
const { fetchTop5kAccounts, fetchTop10kAccounts, fetchTop25kAccounts, fetchTop50kAccounts, fetchTop100kAccounts, fetchTop200kAccounts, fetchTop300kAccounts } = require('./leaderBoard.controller');
const router = express.Router();


// Define the route to fetch the top 5k accounts
router.get('/leaderboardOf5k', fetchTop5kAccounts);
router.get('/leaderboardOf10k', fetchTop10kAccounts);
router.get('/leaderboardOf25k', fetchTop25kAccounts);
router.get('/leaderboardOf50k', fetchTop50kAccounts);
router.get('/leaderboardOf100k', fetchTop100kAccounts);
router.get('/leaderboardOf200k', fetchTop200kAccounts);
router.get('/leaderboardOf300k', fetchTop300kAccounts);

module.exports = router