const deepMerge = (target, source) => {
	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			if (
				typeof source[key] === "object" &&
				source[key] !== null &&
				!Array.isArray(source[key])
			) {
				if (!target[key]) {
					target[key] = {}; // Ensure the target has an object to merge into
				}
				deepMerge(target[key], source[key]); // Recursively merge
			} else {
				target[key] = source[key]; // Direct assignment for non-objects
			}
		}
	}
	return target;
};

module.exports = deepMerge;
