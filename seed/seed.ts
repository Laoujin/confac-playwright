import pkg from 'mongodb';
const { MongoClient, ObjectID } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SeedOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  dataFile?: string;
}

const defaultOptions: SeedOptions = {
  host: process.env.MONGO_HOST || 'localhost',
  port: parseInt(process.env.MONGO_PORT || '27018', 10),
  username: process.env.MONGO_USERNAME || 'admin',
  password: process.env.MONGO_PASSWORD || 'pwd',
  database: process.env.MONGO_DB || 'confac-test',
  dataFile: path.join(__dirname, 'baseline-data.json'),
};

function convertIds(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string' && /^[0-9a-f]{24}$/i.test(obj)) {
    return new ObjectID(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertIds);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_id' || key.endsWith('Id')) {
        result[key] = typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)
          ? new ObjectID(value)
          : convertIds(value);
      } else {
        result[key] = convertIds(value);
      }
    }
    return result;
  }

  return obj;
}

export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  const opts = { ...defaultOptions, ...options };

  const connectionString = opts.username && opts.password
    ? `mongodb://${opts.username}:${opts.password}@${opts.host}:${opts.port}/${opts.database}`
    : `mongodb://${opts.host}:${opts.port}/${opts.database}`;

  const client = new MongoClient(connectionString, {
    authSource: 'admin',
    useUnifiedTopology: true,
    useNewUrlParser: true
  });

  try {
    await client.connect();
    console.log(`Connected to MongoDB at ${opts.host}:${opts.port}`);

    const db = client.db(opts.database);

    // Read baseline data
    const dataPath = opts.dataFile || defaultOptions.dataFile!;
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    // Drop and recreate collections
    const collections = ['roles', 'users', 'consultants', 'clients', 'projects', 'projects_month', 'invoices', 'config', 'attachments', 'audit'];

    for (const collection of collections) {
      try {
        await db.collection(collection).drop();
        console.log(`Dropped collection: ${collection}`);
      } catch (e: any) {
        if (e.codeName !== 'NamespaceNotFound') {
          console.warn(`Warning dropping ${collection}:`, e.message);
        }
      }
    }

    // Insert baseline data
    if (data.roles?.length) {
      await db.collection('roles').insertMany(convertIds(data.roles));
      console.log(`Inserted ${data.roles.length} roles`);
    }

    if (data.users?.length) {
      await db.collection('users').insertMany(convertIds(data.users));
      console.log(`Inserted ${data.users.length} users`);
    }

    if (data.consultants?.length) {
      await db.collection('consultants').insertMany(convertIds(data.consultants));
      console.log(`Inserted ${data.consultants.length} consultants`);
    }

    if (data.clients?.length) {
      await db.collection('clients').insertMany(convertIds(data.clients));
      console.log(`Inserted ${data.clients.length} clients`);
    }

    if (data.projects?.length) {
      await db.collection('projects').insertMany(convertIds(data.projects));
      console.log(`Inserted ${data.projects.length} projects`);
    }

    if (data.config) {
      await db.collection('config').insertOne(convertIds(data.config));
      console.log('Inserted config');
    }

    console.log('Database seeded successfully!');
  } finally {
    await client.close();
  }
}

export async function resetDatabase(options: SeedOptions = {}): Promise<void> {
  return seedDatabase(options);
}

// CLI entry point - always run when executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
