const NodeCache = require("node-cache");

// stdTTL: 300초(5분) 후 자동 만료
const cache = new NodeCache({ stdTTL: 300 });

module.exports = cache;
