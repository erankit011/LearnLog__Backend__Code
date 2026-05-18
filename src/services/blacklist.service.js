const tokenBlacklist = new Set();

const addToBlacklist = (token, expiryTime) => {
  tokenBlacklist.add(token);
  
  const expiryMs = expiryTime * 1000;
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, expiryMs);
};

const isBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

const clearBlacklist = () => {
  tokenBlacklist.clear();
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  clearBlacklist,
};
