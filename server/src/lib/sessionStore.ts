import MySQLStoreFactory from "express-mysql-session";
import session from "express-session";

const MySQLStore = MySQLStoreFactory(session);

export const sessionStore = new MySQLStore({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
