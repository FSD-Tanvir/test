
const invoiceMailingHTMLTemplate = async(order) => {


    let addOnsRow = '';

        if (order?.addOns !== null || order?.addOns !== undefined || order?.addOns !== 0) {
            addOnsRow = `
                <tr>
                    <td colspan="2">Addons:</td>
                    <td>+ $${order?.addOns}</td>
                </tr>
            `;
        }

    let Discount = 0;

    if(order.discountPrice === 0){
        Discount = 0;
    }
    else{
       Discount = Math.floor((order.orderItems[0].challengePrice) - (order.discountPrice));
    }

    return `
    <!DOCTYPE html>
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
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #6a1b9a;
                padding: 20px;
                text-align: center;
                color: white;
                border-radius: 8px 8px 0 0;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 20px;
            }
            .content h2 {
                font-size: 18px;
                margin-bottom: 20px;
            }
            .order-info {
                margin-bottom: 20px;
            }
            .order-info h3 {
                font-size: 16px;
                margin-bottom: 10px;
            }
            .order-info p {
                margin: 0;
                font-size: 14px;
                color: #666;
            }
            .table-container {
                overflow-x: auto;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            table th, table td {
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
            }
            table th {
                background-color: #f5f5f5;
            }
            .total {
                text-align: right;
                font-weight: bold;
            }
            .total td {
                border: none;
            }
            .billing-address {
                padding: 20px;
                background-color: #f0f0f0;
                border-radius: 8px;
                text-align: right;
            }
            .billing-address h3 {
                margin-top: 0;
                font-size: 16px;
                color: #6a1b9a;
            }
            .billing-address p {
                margin: 5px 0;
                font-size: 14px;
                color: #333;
            }
            .footer {
                padding: 20px;
                text-align: center;
                color: #777;
                font-size: 14px;
                border-top: 1px solid #ddd;
                border-radius: 0 0 8px 8px;
            }
            @media (max-width: 600px) {
                .header h1 {
                    font-size: 20px;
                }
                .content h2 {
                    font-size: 16px;
                }
                table th, table td {
                    font-size: 12px;
                }
                .total {
                    font-size: 14px;
                }
                .billing-address {
                    text-align: left;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Thanks for shopping with us</h1>
            </div>
            <div class="content">
                <h2>Hi ${order.buyerDetails.first} ${order.buyerDetails.last},</h2>
                <p>We have finished processing your order:</p>
                <div class="order-info">
                    <h3>Order ${order.orderId} (${new Date(order.createdAt).toLocaleDateString()})</h3>
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
                                    $${order.orderItems[0].challengePrice !== null && order.orderItems[0].challengePrice !== undefined 
                                        ? order.orderItems[0].challengePrice.toFixed(2) 
                                        : '<a href="https://discord.com/invite/2NpszcabHC" target="_blank">Please contact on Discord</a>'}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2">Subtotal:</td>
                                
                                 <td>
                                    $${order.subtotal !== null && order.subtotal !== undefined 
                                        ? order.subtotal.toFixed(2) 
                                        : '<a href="https://discord.com/invite/2NpszcabHC" target="_blank">Please contact on Discord</a>'}
                                </td>
                            </tr>
                            ${
                                addOnsRow
                             }

                            <tr>
                                <td colspan="2">Discount:</td>
								<td>
  									
								- $${Discount}
									
								</td>
                            </tr>
                            <tr>
                                <td colspan="2">Payment method:</td>
                                <td>${order.paymentMethod}</td>
                            </tr>
                            <tr class="total">
                                <td colspan="2">Total:</td>
                                  <td>
                                    $${order.totalPrice !== null && order.totalPrice !== undefined 
                                        ? order.totalPrice.toFixed(2) 
                                        : '<a href="https://discord.com/invite/2NpszcabHC" target="_blank">Please contact on Discord</a>'}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="billing-address">
                      <p>${order.buyerDetails.first} ${order.buyerDetails.last}<br>
                       ${order.buyerDetails.addr}<br>
                       ${order.buyerDetails.city}<br>
                       ${order.buyerDetails.zipCode}<br>
                       ${order.buyerDetails.country}<br>
                       ${order.buyerDetails.phone}<br>
                       ${order.buyerDetails.email}<br>
                       </p>
                </div>
            </div>
            <div class="footer">
                <p>Thanks for shopping with us.</p>
            </div>
        </div>
    </body>
    </html>`;

    
}

module.exports = {invoiceMailingHTMLTemplate}