import { test as base } from '@playwright/test';
import pkg from 'mongodb';
const { MongoClient } = pkg;
type Db = pkg.Db;

type ConfacFixtures = {
  db: Db;
}


export const test = base.extend<ConfacFixtures>({
  db: async ({ page }, use) => {
    const client = new MongoClient('mongodb://admin:pwd@localhost:27018/confac-test', {authSource: 'admin', useUnifiedTopology: true});
    await client.connect();
    const db = client.db('confac-test');

    // ATTN: done as part of the db.setup now
    // console.log('dropping confac-playwright');
    // await db.dropDatabase();

    await use(db);

    await client.close();
  },
});

export { expect } from '@playwright/test';
