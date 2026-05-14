const snowflake = require("snowflake-sdk");
require("dotenv").config();

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
});

connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect to Snowflake:", err.message);
  } else {
    console.log("Connected to Snowflake!");
  }
});

module.exports = connection;