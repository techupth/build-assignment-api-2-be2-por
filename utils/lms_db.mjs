//create connection without env file (not secure)
/* import pkg from "pg";
const { Pool } = pgk;

const connectionPool = new Pool({
    user: `postgres`,
    host: `localhost`,
    database: `LMS database`,
    password: 1234,
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

module.exports = connectionPool; */

import 'dotenv/config';
import pkg from "pg";
const { Pool } = pkg;

const connectionPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

//Masking sensitive data by redacting password
const safeLogDatabaseUrl = (url) => {
    const urlObj = new URL(url);
    const maskedPassword = urlObj.password ? `*****` : '';
    const safeUrl = `${urlObj.protocol}//${urlObj.username}:${maskedPassword}@${urlObj.hostname}:${urlObj.port}${urlObj.pathname}`;
    return safeUrl;
};

console.log(`Database connected at: ${safeLogDatabaseUrl(process.env.DATABASE_URL)}`);

export default connectionPool;