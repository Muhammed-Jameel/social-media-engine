import { createDatabase, migrateDatabase } from "@social-media-plugin/db";

const database = await createDatabase();
await migrateDatabase(database);
await database.close();
console.log("Database migrations applied.");

