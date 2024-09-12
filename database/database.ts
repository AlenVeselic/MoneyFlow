// app/db/db.ts

import {
  SQLiteDatabase,
  enablePromise,
  openDatabase,
} from 'react-native-sqlite-storage';

// Enable promise for SQLite
enablePromise(true);

export const connectToDatabase = async () => {
  return openDatabase(
    {name: 'MoneyFlow.db'},
    () => {},
    error => {
      console.error(error);
      throw Error('Could not connect to database');
    },
  );
};

export const createTables = async (db: SQLiteDatabase) => {
  const databaseInitiationCommands = [
    `
    CREATE TABLE IF NOT EXISTS Category (
      id INTEGER PRIMARY KEY,
      createdOn INTEGER DEFAULT (strftime('%s','now')),
      modifiedOn INTEGER DEFAULT (strftime('%s','now')),

      title VARCHAR(255) NOT NULL
  );
  	`,
    `
      CREATE TABLE IF NOT EXISTS FlowType (
        id INTEGER PRIMARY KEY,
        createdOn INTEGER DEFAULT (strftime('%s','now')),
        modifiedOn INTEGER DEFAULT (strftime('%s','now')),
  
        title VARCHAR(255) NOT NULL
    );
        `,
    ` 
        CREATE TABLE IF NOT EXISTS Flow(
          id INTEGER PRIMARY KEY,
          createdOn INTEGER DEFAULT (strftime('%s','now')),
          modifiedOn INTEGER DEFAULT (strftime('%s','now')),

          sum INTEGER NOT NULL,
          currency  VARCHAR(255) NOT NULL,
          category_id INTEGER NOT NULL,
          flow_type_id INTEGER NOT NULL,

          FOREIGN KEY(category_id) REFERENCES Category(id),
          FOREIGN KEY(flow_type_id) REFERENCES FlowType(id)

        );
      `,
  ];
  try {
    for (let command of databaseInitiationCommands) {
      await db.executeSql(command);
    }
  } catch (error) {
    console.error(error);
    throw Error(`Failed to initialize database`);
  }
};

export const seedTables = async (db: SQLiteDatabase) => {
  await seedFlowTypes(db);
  await seedCategories(db);
};

export const seedFlowTypes = async (db: SQLiteDatabase) => {
  const flowTypes = ['income', 'expense'];

  flowTypes.forEach(async type => {
    const searchForFlowType = await db.executeSql(
      'SELECT * FROM FlowType WHERE title=?',
      [type],
    );

    if (searchForFlowType[0].rows.length <= 0) {
      const insertResult = await db.executeSql(
        `INSERT INTO FlowType(createdOn, modifiedOn, title) VALUES (?, ?, ?)`,
        [Date.now(), Date.now(), type],
      );
    }
  });
};

export const seedCategories = async (db: SQLiteDatabase) => {
  const defaultCategories = ['Groceries', 'Bills', 'Food', 'Drinks'];

  defaultCategories.forEach(async category => await getCategory(db, category));
};

export const getTableNames = async (db: SQLiteDatabase): Promise<string[]> => {
  try {
    const tableNames: string[] = [];
    const results = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        tableNames.push(result.rows.item(index).name);
      }
    });
    return tableNames;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get table names from database');
  }
};

export const getCategories = async (db: SQLiteDatabase) => {
  try {
    const categories: any[] = [];
    const queryResults = await db.executeSql('SELECT * FROM Category');
    queryResults?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        categories.push(result.rows.item(index));
      }
    });

    return categories;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get categories from database');
  }
};

export const getFlowTypes = async (db: SQLiteDatabase): Promise<any[]> => {
  return await getAll(db, 'FlowType');
};

const getAll = async (db: SQLiteDatabase, tableName: string) => {
  try {
    const entities: any[] = [];
    const queryResults = await db.executeSql(`SELECT * FROM ${tableName}`);
    queryResults?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        entities.push(result.rows.item(index));
      }
    });

    return entities;
  } catch (error) {
    console.error(error);
    throw Error(`Failed to get all from ${tableName} from database`);
  }
};

export const getFlows = async (db: SQLiteDatabase): Promise<any[]> => {
  try {
    const Flows: any[] = [];
    const queryResults = await db.executeSql(
      `SELECT sum, Category.title AS category, FlowType.title AS flowtype FROM Flow 
      INNER JOIN FlowType ON Flow.flow_type_id = FlowType.id
      INNER JOIN Category ON Flow.category_id = Category.id`,
    );
    queryResults?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        Flows.push(result.rows.item(index));
      }
    });

    return Flows;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get flows from database');
  }
};

export const createFlow = async (
  db: SQLiteDatabase,
  sum: number,
  categoryTitle: string,
  flowTypeId: number,
): Promise<void> => {
  const category = await getCategory(db, categoryTitle);
  const currency = 'EUR';

  try {
    const queryResult = await db.executeSql(
      `INSERT INTO Flow(createdOn, modifiedOn, sum, currency, category_id, flow_type_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [Date.now(), Date.now(), sum, currency, category.id, flowTypeId],
    );

    return queryResult[0].rows.item(0);
  } catch (error) {
    console.error(error);
    throw Error('Failed to create transaction');
  }
};

const getCategory = async (db: SQLiteDatabase, title: string): Promise<any> => {
  const categoryExists = await db.executeSql(
    `SELECT id FROM category WHERE title = ?`,
    [title.toLowerCase()],
  );

  if (categoryExists && categoryExists[0].rows.length > 0)
    return categoryExists[0].rows.item(0);

  // If the category doesn't exist, create it
  await createCategory(db, title);

  // Since this package doesn't support returning, we query the database again after the category is created
  const createdCategory = await db.executeSql(
    `SELECT id FROM category WHERE title = ?`,
    [title.toLowerCase()],
  );

  return createdCategory;
};

export const createCategory = async (
  db: SQLiteDatabase,
  title: string,
): Promise<void> => {
  const creationResult = await db.executeSql(
    'INSERT INTO Category(createdOn, modifiedOn, title) VALUES (?, ?, ?)',
    [Date.now(), Date.now(), title.toLowerCase()],
  );
};
// Code from example

export const removeTable = async (db: SQLiteDatabase, tableName: Table) => {
  const query = `DROP TABLE IF EXISTS ${tableName}`;
  try {
    await db.executeSql(query);
  } catch (error) {
    console.error(error);
    throw Error(`Failed to drop table ${tableName}`);
  }
};
