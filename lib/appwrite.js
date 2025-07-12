import { Account, Client, Databases, ID, Storage } from "appwrite";

const client = new Client();

// V lib/appwrite.js - debug verzia
const PROJECT_ID = "6870c9580035d923b520";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

console.log("Using Project ID:", PROJECT_ID);
console.log("Using Endpoint:", ENDPOINT);

client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database a Collection IDs - exportuj ich správne
export const DATABASE_ID = "6870fbf4001a82d7465e";
export const COLLECTIONS = {
  SCRAPBOOKS: "6870fc4a002403bb1c65",
  MEMORIES: "68713008003484951f4f",
};
export const STORAGE_BUCKET_ID = "68712e870019d31658d4";
export { ID };
export default client;
