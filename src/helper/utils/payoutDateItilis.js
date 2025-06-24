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




const getUniqueTradingDays = (trades, returnDates = false, includeTime = true) => {
    const uniqueDates = new Map();

    trades.forEach((trade) => {
        const openTime = new Date(trade.openTime);

        const year = openTime.getFullYear();
        const month = String(openTime.getMonth() + 1).padStart(2, "0");
        const day = String(openTime.getDate()).padStart(2, "0");

        const dateKey = `${year}-${month}-${day}`;
        if (includeTime) {
            if (!uniqueDates.has(dateKey)) {
                const hours = String(openTime.getHours()).padStart(2, "0");
                const minutes = String(openTime.getMinutes()).padStart(2, "0");
                const seconds = String(openTime.getSeconds()).padStart(2, "0");

                const dateTimeString = `${dateKey} ${hours}:${minutes}:${seconds}`;
                uniqueDates.set(dateKey, dateTimeString);
            }
        } else {
            uniqueDates.set(dateKey, dateKey);
        }
    });

    if (returnDates) {
        return [...uniqueDates.values()].sort((a, b) => new Date(a) - new Date(b));
    }

    return uniqueDates.size;
};





module.exports = {
    getUniqueTradingDays,
};


