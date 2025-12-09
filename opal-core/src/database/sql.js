const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
       
    }
};

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('✅ SQL Database Connected!');
    } catch (err) {
        console.error('❌ SQL Connection Failed:', err);
    }
}

module.exports = { sql, connectDB };
