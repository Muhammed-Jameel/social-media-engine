import { createDatabase, importExistingContent, migrateDatabase, seedCoreData } from "@aurendor/db";

const database = await createDatabase();
await migrateDatabase(database);
await seedCoreData(database);
const summary = await importExistingContent(database);
await database.close();
console.log(JSON.stringify(summary, null, 2));

