const removeObjectProperties = (obj, propertiesToRemove) =>
	Object.fromEntries(Object.entries(obj).filter(([key]) => !propertiesToRemove.includes(key)));

module.exports = {
	removeObjectProperties,
};
