const PRODUCTION = process.env.PRODUCTION_SERVER_URL;
const DEVELOPMENT = process.env.SERVER_URL;
const URL = process.env.NODE_ENV ? PRODUCTION : DEVELOPMENT;

module.exports = { URL };
