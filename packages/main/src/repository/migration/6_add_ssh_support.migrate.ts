
const info = {
  user_version: 6,
  up: `CREATE TABLE IF NOT EXISTS ssh_connections (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id  INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        host          TEXT    NOT NULL,
        port          INTEGER NOT NULL,
        username      TEXT    NOT NULL,
        password      TEXT    NOT NULL,
        privateKey    TEXT,
        passphrase    TEXT
      )`,
  down: 'DROP TABLE ssh_connections',
};

export default info;
