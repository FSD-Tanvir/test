const invoiceMailingHTMLTemplate = async (order) => {
	let addOnsRow = "";

	if (order?.addOns !== null || order?.addOns !== undefined || order?.addOns !== 0) {
		addOnsRow = `
                <tr>
                    <td colspan="2">Addons:</td>
                    <td>+ $${order?.addOns}</td>
                </tr>
            `;
	}

	let Discount = 0;

	if (order.discountPrice === 0) {
		Discount = 0;
	} else {
		Discount = Math.floor(order.orderItems[0].challengePrice - order.discountPrice);
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border: 2px solid #DB8112;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        .header img {
            max-width: 120px;
            height: auto;
        }
        .title {
            color: #DB8112;
            font-size: 24px;
            text-align: center;
            margin-bottom: 20px;
        }
        .content {
            padding: 20px;
        }
        .order-info {
            margin-bottom: 20px;
        }
        .order-info h3 {
            font-size: 18px;
            color: #333;
            font-weight: bold;
        }
        .order-info p {
            font-size: 16px;
            color: #666;
            margin: 0;
        }
        .table-container {
            overflow-x: auto;
            margin-top: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 16px;
            background-color: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        table th, table td {
            padding: 15px;
            text-align: left;
        }
        table th {
            background: linear-gradient(135deg, #DB8112, #ffa64d);
            color: #fff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 14px;
        }
        table td {
            border-bottom: 1px solid #f0f0f0;
            color: #555;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        table tr:hover {
            background-color: #f9f9f9;
        }
        .total {
            font-weight: bold;
            text-align: right;
            background-color: #f5f5f5;
        }
        .total td {
            border: none;
            color: #333;
        }
        .billing-address {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            color: #333;
            font-size: 14px;
            text-align: right;
        }
        .footer {
            padding: 20px;
            text-align: center;
            color: #777;
            font-size: 14px;
            border-top: 1px solid #ddd;
        }
        .footer a {
            color: #DB8112;
            text-decoration: none;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #DB8112;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 10px !important;
            }
            .title {
                font-size: 22px !important;
            }
            table th, table td {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo">
        </div>
        <div class="title">Your Order Confirmation</div>
        <div class="content">
            <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
                Hi <span style="font-weight: bold; color: #DB8112;">${order.buyerDetails.first} ${
		order.buyerDetails.last
	}</span>,
            </p>
            <p style="font-size: 12px; color: #333;">
                We have finished processing your order:
            </p>
            <div class="order-info">
                <h3>
                    Order <span style="font-weight: bold; font-style: italic; color: #DB8112;">${
											order.orderId
										}</span> 
                    (${new Date(order.createdAt).toLocaleDateString()})
                </h3>
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${order.orderItems[0].challengeName}</td>
                        <td>1</td>
                        <td>
                            ${
															order.orderItems[0].challengePrice !== null &&
															order.orderItems[0].challengePrice !== undefined
																? order.orderItems[0].challengePrice.toFixed(2)
																: '<a href="https://discord.com/invite/XTwRAEVm4G" target="_blank">Please contact on Discord</a>'
														}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">Subtotal:</td>
                        <td>
                            ${
															order.subtotal !== null && order.subtotal !== undefined
																? order.subtotal.toFixed(2)
																: '<a href="https://discord.com/invite/XTwRAEVm4G" target="_blank">Please contact on Discord</a>'
														}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">Discount:</td>
                        <td>- $${order.discountPrice}</td>
                    </tr>
                    <tr>
                        <td colspan="2">Payment method:</td>
                        <td>${order.paymentMethod}</td>
                    </tr>
                    <tr class="total">
                        <td colspan="2">Total:</td>
                        <td>
                            ${
															order.totalPrice !== null && order.totalPrice !== undefined
																? order.totalPrice.toFixed(2)
																: '<a href="https://discord.com/invite/XTwRAEVm4G" target="_blank">Please contact on Discord</a>'
														}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="billing-address">
            <p>${order.buyerDetails.first} ${order.buyerDetails.last}<br>
               ${order.buyerDetails.country ? order?.buyerDetails.country : ""}<br>
               ${order.buyerDetails.phone ? order.buyerDetails.phone : ""}<br>
               ${order.buyerDetails.email}<br>
            </p>
        </div>

        <!-- Help Message -->
    <p style="font-size: 16px; color: #333; margin-top: 20px; line-height: 1.6;">
        If you need any help or have questions about your account, please contact our team at 
        <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
    </p>

    <!-- Support Section -->
    <p style="font-size: 14px; color: #777; margin-top: 20px; line-height: 1.6;">
        Need further assistance? <a href="https://foxx-funded.com/en/contact-us#contact-section" style="color: #DB8112; text-decoration: none; font-weight: bold;">Contact our support team</a>.
    </p>

        <div class="footer">
            <p>Thank you for shopping with us! </p>
        </div>
    </div>
</body>
</html>`;
};

module.exports = { invoiceMailingHTMLTemplate };
