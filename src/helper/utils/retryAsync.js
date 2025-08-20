async function retryAsync(fn, args = [], retries = 3, delay = 1000) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const result = await fn(...args);
			return result;
		} catch (err) {
			console.error(`Attempt ${attempt} failed:`, err);
			if (attempt < retries) {
				await new Promise((res) => setTimeout(res, delay));
			}
		}
	}
	console.error(`All ${retries} attempts failed.`);
	return null;
}

module.exports = retryAsync;
