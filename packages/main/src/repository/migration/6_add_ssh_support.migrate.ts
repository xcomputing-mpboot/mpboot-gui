
const info = {
  user_version: 6,
  up: `
    ALTER TABLE workspaces ADD COLUMN is_ssh INTEGER NOT NULL DEFAULT 0;


    CREATE TABLE IF NOT EXISTS ssh_connections (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id  INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      host          TEXT    NOT NULL,
      port          INTEGER NOT NULL,
      username      TEXT    NOT NULL,
      password      TEXT    NOT NULL,
      privateKey    TEXT,
      passphrase    TEXT
    );
  `,
  down: `
    DROP TABLE IF EXISTS ssh_connections;
    -- SQLite không hỗ trợ DROP COLUMN, nếu rollback cần rebuild bảng workspaces
  `,
};

export default info;
