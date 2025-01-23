const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CallbackResponseSaveSchema = new Schema(
  {
    rsp_appln_id: { type: String,},
    rsp_billercode: { type: String,},
    rsp_fpxmode: { type: String, },
    rsp_orderid: { type: String,},
    rsp_sessionpayid: { type: String, default: "" },
    rsp_amount: { type: String,},
    rsp_trxstatus: { type: String, required: true },
    rst_stcode: { type: String},
    rsp_bankid: { type: String},
    rsp_bankname: { type: String },
    rsp_fpxid: { type: String },
    rsp_fpxorderno: { type: String, },
    rsp_trxdatetime: { type: String, },
    rsp_process_mode: { type: String, },
    rsp_hash: { type: String, },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const ZenpayCallbackResponseSave = mongoose.model(
  "zenpayCallbackResponseSave",
  CallbackResponseSaveSchema
);

module.exports = { ZenpayCallbackResponseSave };
