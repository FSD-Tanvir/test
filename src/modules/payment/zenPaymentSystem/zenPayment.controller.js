const config = require("../../../config/config");
const generatePassword = require("../../../helper/utils/generatePasswordForMt5");
const { MOrder } = require("../../orders/orders.schema");
const { updateOrder } = require("../../orders/orders.services");
const MUser = require("../../users/users.schema");
const {
  handleMt5AccountCreate,
  updateUser,
  updateUserRole,
} = require("../../users/users.services");
const {
  callZenPayAPI,
  redirectToBankLoginService,
  saveZenpayWebhookData,
} = require("./zenPayment.services");

const bCode = config.zenPayBCode;
const hKey = config.zenPayHKay;

const getRetData = async (req, res) => {
  try {
    const data = await callZenPayAPI("RET", bCode, hKey);
    res.json(data);
  } catch (error) {
    res.status(500).send("Error calling ZenPay API");
  }
};

const getCorData = async (req, res) => {
  try {
    const data = await callZenPayAPI("COR", bCode, hKey);
    res.json(data);
  } catch (error) {
    res.status(500).send("Error calling ZenPay API");
  }
};

const redirectToBank = async (req, res) => {
  // console.log("I am in redirectToBank",req.body);
  const {
    appid,
    btype,
    orderid,
    email,
    amount,
    bankcode,
    callbackURL,
    returnURL,
  } = req.body;
  const bcode = config.zenPayBCode;
  const hkey = config.zenPayHKay;

  const queries = {
    bcode,
    hkey,
    btype,
    orderid,
    email,
    amount,
    bankcode,
    callbackURL,
    returnURL,
  };

  try {
    const data = await redirectToBankLoginService(queries);
    res.json(data); // Respond with redirect URL
  } catch (error) {
    res.status(500).json(error); // Respond with error if fetching fails
  }
};

const callbackResponse = async (req, res) => {
  const { rsp_orderid, rsp_trxstatus } = req.body;
  console.log("i am in callbackResponse", req.body);

  //   i am in callbackResponse {
  //  rsp_appln_id: 'ZNP',
  //   rsp_billercode: '200040043',
  // rsp_fpxmode: '2',
  //   rsp_orderid: '940104',
  //  rsp_sessionpayid: '',
  //   rsp_amount: '523.35',
  //    rsp_trxstatus: 'SUCCESSFUL',
  // rst_stcode: '00',
  //   rsp_bankid: 'BCBB0235',
  //  rsp_bankname: 'BCBB0235',
  //  rsp_fpxid: '2411131523520940',
  // rsp_fpxorderno: 'ZNQ241113028883',
  // rsp_trxdatetime: '20241113152351',
  // rsp_process_mode: '2',
  //  rsp_hash: '3903e915803f12310b03405ae185c824'
  // }

  if (rsp_trxstatus !== "SUCCESSFUL") {
    console.warn("Invalid transaction status:", rsp_trxstatus);
    return res.status(401).send("Invalid transaction status");
  }

  try {
    if (rsp_trxstatus === "SUCCESSFUL") {
      // Save the webhook data to the database in a

      const savedZenpayTransactionData = await saveZenpayWebhookData(req.body);
      if (!savedZenpayTransactionData) {
        console.error("Failed to save transaction data");
        return res.status(400).send("Failed to save transaction data");
      }

      // find the order in the database
      const order = await MOrder.findOne({ orderId: `#${rsp_orderid}` });
      console.log("Order retrieved:", order);

      if (!order) {
        console.error("Order not found:", rsp_orderid);
        return res.status(404).send("Order not found");
      }

      // destructure the order data for buyer details, order items, and group also challenge data
      const { buyerDetails, orderItems, group } = order;
      const challengeData = orderItems[0];

      // Find the user
      const user = await MUser.findOne({ email: buyerDetails?.email });

      console.log("User retrieved:", user);
      

      // Find the duplicate account
      const duplicateAccount =
        user &&
        (await user.mt5Accounts.find(
          (account) => account.productId === `#${rsp_orderid}`
        ));

      if (duplicateAccount) {
        console.log("Duplicate account found:", duplicateAccount);
        return res.status(404).send(" Duplicate account found");
      } else {
        // prepare data for mt5 account
        const mt5SignUpData = {
          EMail: buyerDetails.email,
          master_pass: generatePassword(),
          investor_pass: generatePassword(),
          amount: challengeData.accountSize,
          FirstName: `summit-strike ${challengeData.challengeName} ${challengeData.challengeType === "funded" ? "funded" : "phase1"}  ${buyerDetails.first} ${buyerDetails.last} `,
          LastName: buyerDetails.last,
          Country: buyerDetails.country,
          Address: buyerDetails.addr,
          City: buyerDetails.city,
          ZIPCode: buyerDetails.zipCode,
          Phone: buyerDetails.phone,
          Leverage: 30,
          Group: group,
        };

        console.log("MT5 Sign Up Data:", mt5SignUpData);

        // create mt5 account
        const createUser = await handleMt5AccountCreate(mt5SignUpData);
        console.log("MT5 account creation response:", createUser);

        if (createUser?.login) {
          const challengeStage =
            challengeData.challengeType === "funded" ? "funded" : "phase1";
          const challengeStages = {
            ...challengeData.challengeStages,
            phase1:
              challengeStage === "funded"
                ? null
                : challengeData.challengeStages.phase1,
            phase2:
              challengeStage === "funded" || challengeStage === "phase1"
                ? null
                : challengeData.challengeStages.phase2,
            funded:
              challengeStage === "phase1"
                ? null
                : challengeData.challengeStages.funded,
          };

          const mt5Data = {
            account: createUser.login,
            investorPassword: createUser.investor_pass,
            masterPassword: createUser.master_pass,
            productId: `#${rsp_orderid}`,
            challengeStage,
            challengeStageData: { ...challengeData, challengeStages },
            group: mt5SignUpData.Group,
          };

          console.log("MT5 Data prepared for update:", mt5Data);

          await updateUser(order.buyerDetails?.userId, {
            mt5Accounts: [mt5Data],
          });

          await Promise.all([
            updateOrder(order._id, {
              orderStatus: "Delivered",
              paymentStatus: "Paid",
            }),
            updateUserRole(buyerDetails.email, "trader"),
          ]);

          console.log("User roles and order status updated successfully.");
        }
      }

      res.status(200).send("Callback received successfully");
    } else {
      res.status(200).send("Callback received successfully");
    }
  } catch (error) {
    res.status(500).send("Error calling ZenPay API");
  }
};

module.exports = { getRetData, getCorData, redirectToBank, callbackResponse };
