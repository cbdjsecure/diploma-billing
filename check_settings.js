import db from "./server/database.js";
const rows = db.prepare("SELECT * FROM settings").all();
console.log(JSON.stringify(rows, null, 2));
