const info = {
  user_version: 1,
  up: `CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_ssh INTEGER NOT NULL DEFAULT 0
      )`,
  down: 'DROP TABLE workspaces',
};

export default info;
