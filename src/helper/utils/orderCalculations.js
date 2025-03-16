const calculateDiscount = (price, percentage) => ((price * (percentage || 0)) / 100).toFixed(2);

const calculateTotal = (price, discount) => Math.max(price - discount, 0).toFixed(2);

module.exports = {
    calculateDiscount,
    calculateTotal,
};
