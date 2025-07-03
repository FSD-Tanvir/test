// plugins/customIdGenerator.js

const generateCustomId = require("../utils/generateCustomId");

const customIdGenerator = (schema, options) => {
	const {
		field = "customId",
		prefix = "GEN",
		enableCondition = () => true,
		dynamicPrefix = null,
	} = options;

	schema.pre("save", async function (next) {
		try {
			// Check if the field (e.g., userId) is not set and the enableCondition returns true
			if (!this[field] && enableCondition(this)) {
				// Determine the prefix (could be dynamic or static)
				const finalPrefix = dynamicPrefix ? await dynamicPrefix(this) : prefix;

				// Generate the custom ID using the determined prefix
				this[field] = await generateCustomId(finalPrefix);
			}
			next(); // Proceed to the next middleware or save operation
		} catch (error) {
			next(error); // If an error occurs, pass it to the next middleware
		}
	});
};

module.exports = customIdGenerator;
