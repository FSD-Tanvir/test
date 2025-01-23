const removeIds = async (obj, seen = new WeakSet()) => {
  // Skip non-object values
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Check for circular references
  if (seen.has(obj)) {
    return obj;
  }

  // Mark this object as seen
  seen.add(obj);

  const result = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (key === '_id' || key === '__v') {
      continue;
    }
    
    result[key] = await removeIds(obj[key], seen);
  }

  return result;
};

const resolveNestedPromises = async (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      result[key] = value instanceof Promise ? await value : value;
    }
  }
  return result;
};

module.exports = { removeIds, resolveNestedPromises };
