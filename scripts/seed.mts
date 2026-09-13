import { createDatabase, migrateDatabase, seedCoreData } from "@social-media-plugin/db";

const database = await createDatabase();
await migrateDatabase(database);
await seedCoreData(database);
await database.close();
console.log("Core SOCIAL_MEDIA_PLUGIN seed applied.");

