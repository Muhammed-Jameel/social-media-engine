import { createDatabase, migrateDatabase, seedCoreData, syncBrandSourceManifest } from "@aurendor/db";

const database = await createDatabase();
await migrateDatabase(database);
await seedCoreData(database);
const summary = await syncBrandSourceManifest(database);
console.log(JSON.stringify(summary, null, 2));
await database.close();
