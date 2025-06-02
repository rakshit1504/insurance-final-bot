import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDB() {
  return open({
    filename: "./insurance.db",
    driver: sqlite3.Database,
  });
}

export async function setupDatabase() {
  const db = await getDB();

  // Insurance plans
  await db.exec(`
    CREATE TABLE IF NOT EXISTS insurance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `);

  // User selection table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_selection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      insurance_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insurance_id) REFERENCES insurance(id)
    );
  `);

  const rows = await db.all("SELECT * FROM insurance");
  if (rows.length === 0) {
    const plans = [
      ["Rak Basic", "Basic plan with ₹2L coverage. Valid till Dec 2025."],
      ["Rak Standard", "Includes OPD + ₹5L cover. Valid till Dec 2025."],
      ["Rak Premium", "₹10L cover + dental + mental health. Valid till Dec 2025."],
      ["Rak Family", "₹20L family cover (4 members). Valid till Dec 2025."],
      ["Rak Elite", "₹50L + worldwide coverage. Valid till Dec 2025."],
    ];

    for (const [name, desc] of plans) {
      await db.run("INSERT INTO insurance (name, description) VALUES (?, ?)", [name, desc]);
    }
  }
}
