import { createDatabase, migrateDatabase } from "@aurendor/db";

const database = await createDatabase();
await migrateDatabase(database);
await database.close();
console.log("Database migrations applied.");

