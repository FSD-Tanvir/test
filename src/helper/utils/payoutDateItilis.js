const getDateBeforeDays = (days) => {
    const currentDate = new Date();
    const pastDate = new Date(currentDate.setDate(currentDate.getDate() - days));

    const year = pastDate.getFullYear();
    const month = String(pastDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const day = String(pastDate.getDate()).padStart(2, "0");
    const hours = String(pastDate.getHours()).padStart(2, "0");
    const minutes = String(pastDate.getMinutes()).padStart(2, "0");
    const seconds = String(pastDate.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// const formatDateTime = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const hours = String(date.getHours()).padStart(2, "0");
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     const seconds = String(date.getSeconds()).padStart(2, "0");
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// };

const getUniqueTradingDays = (trades) => {
    const uniqueDates = new Set();

    trades.forEach((trade) => {
        const closeTime = new Date(trade.openTime);
        console.log("closeTime", closeTime);

        // Extract the year, month, and day directly
        const year = closeTime.getFullYear();
        const month = closeTime.getMonth(); // Month is zero-based (0 = January, 11 = December)
        const day = closeTime.getDate();

        // Create a unique string by combining year, month, and day
        const dateString = `${year}-${month + 1}-${day}`; // Adjust month to be 1-based
        uniqueDates.add(dateString); // Add date string to Set (ensures uniqueness)
    });

    return uniqueDates.size; // Number of unique trading days
};



// Export the functions as a module
module.exports = {
    getUniqueTradingDays,
};
