import { createDatabase, migrateDatabase, seedCoreData } from "@aurendor/db";

const database = await createDatabase();
await migrateDatabase(database);
await seedCoreData(database);
await database.close();
console.log("Core AURENDOR seed applied.");

