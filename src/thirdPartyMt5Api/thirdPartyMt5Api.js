const fetch = require("node-fetch");
const config = require("../config/config");
const BASE_URL = config.Mt5BaseUrl;
const token = config.mt5Token;
const newsUrl = config.newsUrl;


// Helper function for retrying an operation up to 3 times
const retryOperation = async (operation, retries = 3, delay = 1000) => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			return await operation(); // Try executing the operation
		} catch (error) {
			console.error(`Attempt ${attempt} failed. Error: ${error.message}`);
			if (attempt === retries) {
				throw new Error(`Operation failed after ${retries} retries`);
			}
			await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
		}
	}
};


// connect manager in meta5Api
const connectManager = async () => {
	const url = `${BASE_URL}/Connect?user=${config.managerID}&password=${config.password}&server=${config.serverConfig}&timeout=15000`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.text();
		return data;
	} catch (error) { }
};



// token health check in every two second in meta5Api
const healthCheck = async (id) => {
	const url = `${BASE_URL}/Health?id=${id}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.text();
		return data;
	} catch (error) { }
};

// create account and deposit

const accountCreateAndDeposit = async (userDetails) => {


	if (!userDetails.EMail) {
		throw new Error("EMail is required");
	}

	const baseParams = {
		id: token,
		master_pass: userDetails.master_pass || "",
		investor_pass: userDetails.investor_pass || "",
		enabled: userDetails.enabled || "true",
		amount: userDetails.amount || "",
		ClientID: userDetails.ClientID || "",
		FirstName: userDetails.FirstName || "",
		LastName: userDetails.LastName || "",
		MiddleName: userDetails.MiddleName || "",
		OTPSecret: userDetails.OTPSecret || "",
		LimitOrders: userDetails.LimitOrders || "",
		LimitPositionsValue: userDetails.LimitPositionsValue || "",
		Login: userDetails.Login || "",
		Group: userDetails.Group || "",
		CertSerialNumber: userDetails.CertSerialNumber || "",
		Rights: userDetails.Rights || "USER_RIGHT_ENABLED",
		Registration: userDetails.Registration || "",
		LastAccess: userDetails.LastAccess || "",
		LastIP: userDetails.LastIP || "",
		Name: userDetails.Name || "",
		Company: userDetails.Company || "",
		Account: userDetails.Account || "",
		Country: userDetails.Country || "",
		Language: userDetails.Language || "",
		City: userDetails.City || "",
		State: userDetails.State || "",
		ZIPCode: userDetails.ZIPCode || "",
		Address: userDetails.Address || "",
		Phone: userDetails.Phone || "",
		EMail: userDetails.EMail || "",
		ID: userDetails.ID || "",
		Status: userDetails.Status || "",
		Comment: userDetails.Comment || "",
		Color: userDetails.Color || "",
		PhonePassword: userDetails.PhonePassword || "",
		Leverage: userDetails.Leverage || "",
		Agent: userDetails.Agent || "",
		Balance: userDetails.Balance || "",
		Credit: userDetails.Credit || "",
		InterestRate: userDetails.InterestRate || "",
		CommissionDaily: userDetails.CommissionDaily || "",
		CommissionMonthly: userDetails.CommissionMonthly || "",
		CommissionAgentDaily: userDetails.CommissionAgentDaily || "",
		CommissionAgentMonthly: userDetails.CommissionAgentMonthly || "",
		BalancePrevDay: userDetails.BalancePrevDay || "",
		BalancePrevMonth: userDetails.BalancePrevMonth || "",
		EquityPrevDay: userDetails.EquityPrevDay || "",
		EquityPrevMonth: userDetails.EquityPrevMonth || "",
		LastPassChange: userDetails.LastPassChange || "",
		LeadCampaign: userDetails.LeadCampaign || "",
		LeadSource: userDetails.LeadSource || "",
		ApiDataClearAll: userDetails.ApiDataClearAll || "",
		ExternalAccountClear: userDetails.ExternalAccountClear || "",
		ExternalAccountTotal: userDetails.ExternalAccountTotal || "",
		MQID: userDetails.MQID || "",
	};

	// Construct the query string
	const queryString = new URLSearchParams(baseParams).toString();

	const url = `${BASE_URL}/AccountCreateAndDeposit?${queryString}`;

	try {
		const response = await fetch(url, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		return {
			master_pass: userDetails.master_pass,
			investor_pass: userDetails.investor_pass,
			login: data.login,
		};
	} catch (error) {
		console.error("Error:", error);
	}
};

// get user details from mt5 using account
const userDetails = async (account) => {

	const url = `${BASE_URL}/UserDetails?id=${token}&login=${account}`;
	return retryOperation(async () => {
		const response = await fetch(url, { method: "GET" });
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	});
};

// get account details from mt5 using account

const accountDetails = async (account) => {

	const url = `${BASE_URL}/AccountDetails?id=${token}&login=${account}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get all accountsDetails from mt5

const getAllAccountDetails = async () => {

	const url = `${BASE_URL}/AccountDetailsMany?id=${token}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get all accounts summery from mt5

const getAllAccountSummery = async () => {

	const url = `${BASE_URL}/AccountsSummary?id=${token}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get single account summery from mt5

const getSingleAccountSummery = async (account) => {

	const url = `${BASE_URL}/AccountsSummary?id=${token}&login=${account}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		// if (!response.ok) {
		// 	throw new Error(`HTTP error! status: ${response.status}`);
		// }
		const data = await response.json();
		return data;
	} catch (error) {
		// console.log("Error:", error);
	}
};

// get all accounts online from mt5

const getAllAccountOnline = async () => {

	const url = `${BASE_URL}/AccountsOnline?id=${token}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		console.log(data);
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

//  update account details from mt5
const accountUpdate = async (account, userDetails) => {
	// Initialize baseParams with the mandatory token
	const baseParams = { id: token };

	// Add only the properties that exist in userDetails
	const optionalFields = [
		"enabled",
		"ClientID",
		"FirstName",
		"LastName",
		"MiddleName",
		"OTPSecret",
		"LimitOrders",
		"LimitPositionsValue",
		"Login",
		"Group",
		"CertSerialNumber",
		"Rights",
		"Registration",
		"LastAccess",
		"LastIP",
		"Name",
		"Company",
		"Account",
		"Country",
		"Language",
		"City",
		"State",
		"ZIPCode",
		"Address",
		"Phone",
		"EMail",
		"ID",
		"Status",
		"Comment",
		"Color",
		"PhonePassword",
		"Leverage",
		"Agent",
		"Balance",
		"Credit",
		"InterestRate",
		"CommissionDaily",
		"CommissionMonthly",
		"CommissionAgentDaily",
		"CommissionAgentMonthly",
		"BalancePrevDay",
		"BalancePrevMonth",
		"EquityPrevDay",
		"EquityPrevMonth",
		"LastPassChange",
		"LeadCampaign",
		"LeadSource",
		"ApiDataClearAll",
		"ExternalAccountClear",
		"ExternalAccountTotal",
		"MQID",
	];

	// biome-ignore lint/complexity/noForEach: <explanation>
	optionalFields.forEach((field) => {
		if (userDetails[field] !== undefined) {
			baseParams[field] = userDetails[field];
		}
	});

	// Construct the query string
	const queryString = new URLSearchParams(baseParams).toString();

	const url = `${BASE_URL}/AccountUpdate?${queryString}&Login=${account}`;

	try {
		const response = await fetch(url, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.text();

		return data;
	} catch (error) {
		console.error("Error:", error);
		throw error;
	}
};

// get user details from mt5 using account
const mt5AccountDelete = async (account) => {

	const url = `${BASE_URL}/AccountDelete?id=${token}&login=${account}`;
	console.log(url);
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.text();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get opened orders using specific account
const openedOrders = async () => {

	const url = `${BASE_URL}/OpenedOrders?id=${token}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get order history using specific account
const orderHistories = async (account, startDate, endDate) => {

	const url = `${BASE_URL}/OrderHistory?id=${token}&login=${account}&from=${startDate}&to=${endDate}&ascending=true`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get all user details
const allUserDetails = async () => {

	const url = `${BASE_URL}/UserDetailsMany?id=${token}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data; // will contain an array of user details
	} catch (error) {
		console.error("Error:", error);
	}
};

// get all account numbers
const getAllAccountNumbers = async () => {

	const url = `${BASE_URL}/Accounts?id=${token}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data; // will contain an array of accounts
	} catch (error) {
		console.error("Error:", error);
	}
};

const changePasswordInMt5 = async (account, password) => {

	const url = `${BASE_URL}/UserPasswordChange?id=${token}&type=USER_PASS_MAIN&login=${account}&password=${password}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.text();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

const balanceDepositAndWithdrawal = async (account, amount) => {

	const url = `${BASE_URL}/Deposit?id=${token}&login=${account}&amount=${amount}&credit=false&comment=deposit`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
};

// get opened orders using specific account
const OrderCloseAll = async (account) => {

	const url = `${BASE_URL}/OrderCloseAll?id=${token}&logins=${account}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Check the response content type before parsing
		const contentType = response.headers.get("content-type");

		let data;
		if (contentType?.includes("application/json")) {
			data = await response.json(); // Parse as JSON if content type is JSON
		} else {
			data = await response.text(); // Parse as text otherwise
		}

		return data;
	} catch (error) {
		console.error("Error:", error);
		throw error; // Re-throw the error to handle it appropriately elsewhere
	}
};



const nesUrlForTrading = async () => {
	const url = `${newsUrl}`;
	try {
		const response = await fetch(url, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching news data:", error.message);
		return [];  // Return empty array if there's an error
	}
};

module.exports = {
	connectManager,
	healthCheck,
	accountCreateAndDeposit,
	userDetails,
	accountDetails,
	getAllAccountDetails,
	getAllAccountSummery,
	getAllAccountOnline,
	accountUpdate,
	mt5AccountDelete,
	orderHistories,
	openedOrders,
	allUserDetails,
	getAllAccountNumbers,
	changePasswordInMt5,
	getSingleAccountSummery,
	balanceDepositAndWithdrawal,
	OrderCloseAll,
	nesUrlForTrading
};
