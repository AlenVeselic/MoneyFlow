// app/db/db.ts

import {NitroSQLiteConnection, open} from 'react-native-nitro-sqlite';

export const connectToDatabase = async () => {
  return open(
    {name: 'MoneyFlow.db'},
    // () => {},
    // error => {
    //   console.error(error);
    //   throw Error('Could not connect to database');
    // },
  );
};

export const createTables = async (db: NitroSQLiteConnection) => {
  const databaseInitiationCommands = [
    `
    CREATE TABLE IF NOT EXISTS Category (
      id INTEGER PRIMARY KEY,
      createdOn INTEGER default (strftime('%s', 'now')),
      modifiedOn INTEGER default (strftime('%s', 'now')),

      title VARCHAR(255) NOT NULL
  );
  	`,
    `
      CREATE TABLE IF NOT EXISTS FlowType (
        id INTEGER PRIMARY KEY,
        createdOn INTEGER default (strftime('%s', 'now')),
        modifiedOn INTEGER default (strftime('%s', 'now')),

        title VARCHAR(255) NOT NULL
    );
        `,
    ` 
        CREATE TABLE IF NOT EXISTS Flow(
          id INTEGER PRIMARY KEY,
          createdOn INTEGER default (strftime('%s', 'now')),
          modifiedOn INTEGER default (strftime('%s', 'now')),

          flowDate INTEGER default (strftime('%s', 'now')),
          sum INTEGER NOT NULL,
          currency  VARCHAR(255) NOT NULL,
          description TEXT NULL,
          category_id INTEGER NOT NULL,
          flow_type_id INTEGER NOT NULL,

          FOREIGN KEY(category_id) REFERENCES Category(id),
          FOREIGN KEY(flow_type_id) REFERENCES FlowType(id)

        );
      `,
  ];
  try {
    for (let command of databaseInitiationCommands) {
      await db.executeAsync(command);
    }
  } catch (error) {
    console.error(error);
    throw Error(`Failed to initialize database`);
  }
};

export const seedTables = async (db: NitroSQLiteConnection) => {
  await seedFlowTypes(db);
  await seedCategories(db);
};

export const seedFlowTypes = async (db: NitroSQLiteConnection) => {
  const flowTypes = ['income', 'expense'];

  flowTypes.forEach(async type => {
    const {results: searchForFlowType} = await db.executeAsync(
      'SELECT * FROM FlowType WHERE title=?',
      [type],
    );

    if (searchForFlowType.length <= 0) {
      const {results: insertResult} = await db.executeAsync(
        `INSERT INTO FlowType(createdOn, modifiedOn, title) VALUES (?, ?, ?)`,
        [Date.now() / 1000, Date.now() / 1000, type],
      );
    }
  });
};

export const seedCategories = async (db: NitroSQLiteConnection) => {
  const defaultCategories = ['Groceries', 'Bills', 'Food', 'Drinks'];

  defaultCategories.forEach(async category => await getCategory(db, category));
};

export const getTableNames = async (
  db: NitroSQLiteConnection,
): Promise<string[]> => {
  try {
    const tableNames: string[] = [];
    const {results} = await db.executeAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    results?.forEach(result => {
      tableNames.push(result.name);
    });
    return tableNames;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get table names from database');
  }
};

export const getCategories = async (db: NitroSQLiteConnection) => {
  try {
    const categories: any[] = [];
    const {results: queryResults} = await db.executeAsync(
      'SELECT * FROM Category',
    );
    queryResults?.forEach(result => {
      categories.push(result);
    });

    return categories;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get categories from database');
  }
};

export const getFlowTypes = async (
  db: NitroSQLiteConnection,
): Promise<any[]> => {
  return await getAll(db, 'FlowType');
};

const getAll = async (db: NitroSQLiteConnection, tableName: string) => {
  try {
    const entities: any[] = [];
    const {results: queryResults} = await db.executeAsync(
      `SELECT * FROM ${tableName}`,
    );
    queryResults?.forEach(result => {
      entities.push(result);
    });

    return entities;
  } catch (error) {
    console.error(error);
    throw Error(`Failed to get all from ${tableName} from database`);
  }
};

export const getFlows = async (
  db: NitroSQLiteConnection,
  date?: Date,
): Promise<any[]> => {
  try {
    const Flows: any[] = [];
    let query = `SELECT CAST(F.createdOn AS TEXT) AS createdOn, F.modifiedOn AS modifiedOn, F.flowDate, date( CAST(F.flowDate AS TEXT), 'unixepoch') AS flowDateAsDate, date( CAST( ? AS TEXT), 'unixepoch') AS passedDateConverted, F.sum AS sum, Category.title AS category, FlowType.title AS flowtype FROM Flow as F 
      LEFT JOIN FlowType ON F.flow_type_id = FlowType.id
      LEFT JOIN Category ON F.category_id = Category.id`;

    if (date) {
      query += ` WHERE date( CAST(F.flowDate AS TEXT), 'unixepoch') > date( CAST( ? AS TEXT), 'unixepoch')`;
    }
    const {results: queryResults} = await db.executeAsync(
      query,
      date ? [date.getTime() / 1000, date.getTime() / 1000] : [],
    );
    queryResults?.forEach(result => {
      Flows.push(result);
    });

    // console.log('Date for flow query:', date ? date.getTime() / 1000 : null);
    // console.log('Query for flows:', query);

    console.log('Flows', Flows);

    return Flows;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get flows from database');
  }
};

export const getFlowsForToday = async (
  db: NitroSQLiteConnection,
): Promise<any[]> => {
  try {
    const flows: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allFlows = await getFlows(db, today);
    // allFlows?.forEach(flow => {
    //   const currentFlowDate = new Date(flow.flowDateAsDate);
    //   currentFlowDate.setHours(0, 0, 0, 0);

    //   console.log(currentFlowDate.getTime(), '==', today.getTime());
    //   console.log(currentFlowDate.getTime() == today.getTime());

    //   if (currentFlowDate.getTime() == today.getTime()) flows.push(flow);
    // });

    return allFlows;
  } catch (error) {
    console.error(error);
    console.error('Failed to get todays flows from database');
    return [];
  }
};

export const createFlow = async (
  db: NitroSQLiteConnection,
  sum: number,
  categoryTitle: string,
  flowTypeId: number,
  description?: string,
  flowDate?: Date,
): Promise<void> => {
  let category = await getCategory(db, categoryTitle);
  const currency = 'EUR';
  console.log('Creating flow with category:', category);
  try {
    if (category.length > 0) {
      category = category[0];
    }
    console.log(
      'Parameters for flow creation: ',
      Date.now() / 1000,
      Date.now() / 1000,
      sum,
      currency,
      category,
      flowTypeId,
      description,
      flowDate ? flowDate.getTime() / 1000 : null,
    );
    const {results: queryResult, rowsAffected} = await db.executeAsync(
      `INSERT INTO Flow(createdOn, modifiedOn, sum, currency, category_id, flow_type_id, description, flowDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Date.now() / 1000,
        Date.now() / 1000,
        sum,
        currency,
        category,
        flowTypeId,
        description,
        flowDate ? flowDate.getTime() / 1000 : null,
      ],
    );

    // console.log(queryResult);
    // console.log(rowsAffected);
    return;
  } catch (error) {
    console.error(error);
    throw Error('Failed to create transaction');
  }
};

const getCategory = async (
  db: NitroSQLiteConnection,
  title: string,
): Promise<any> => {
  console.log('Getting category with title:', title);
  const {results: categoryExists} = await db.executeAsync(
    `SELECT id FROM category WHERE title = ? LIMIT 1`,
    [title],
  );

  console.log('Category exists:', categoryExists);

  if (categoryExists && categoryExists?.length > 0) return categoryExists[0].id;

  console.log('Creating category with title:', title);

  // If the category doesn't exist, create it
  return await createCategory(db, title);

  // Since this package doesn't support returning, we query the database again after the category is created
  // const {results: createdCategory} = await db.executeAsync(
  //   `SELECT id FROM category WHERE title = ? RETURNING id`,
  //   [title.toLowerCase()],
  // );

  // return createdCategory;
};

export const createCategory = async (
  db: NitroSQLiteConnection,
  title: string,
): Promise<any> => {
  const {results: creationResult, rowsAffected} = await db.executeAsync(
    'INSERT INTO Category(createdOn, modifiedOn, title) VALUES (?, ?, ?) RETURNING id',
    [Date.now() / 1000, Date.now() / 1000, title],
  );

  console.log('Category created:', creationResult);
  console.log('Rows affected:', rowsAffected);

  return creationResult.id;
};
// Code from example

export const removeTable = async (
  db: NitroSQLiteConnection,
  tableName: string,
) => {
  const query = `DROP TABLE IF EXISTS ${tableName}`;
  try {
    await db.executeAsync(query);
  } catch (error) {
    console.error(error);
    throw Error(`Failed to drop table ${tableName}`);
  }
};
