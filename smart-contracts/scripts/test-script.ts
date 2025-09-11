import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

console.log("Hello World");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Found" : "Not found");
console.log("Current dir:", process.cwd());