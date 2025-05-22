import type { IDatabase } from './database';
import { default as migration_1 } from './migration/1_create_workspace.migrate';
import { default as migration_2 } from './migration/2_create_workspace_input_data.migrate';
import { default as migration_3 } from './migration/3_create_execution_history.migrate';
import { default as migration_4 } from './migration/4_create_index_on_execution_history.migrate';
import { default as migration_5 } from './migration/5_add_column_on_execution_history.migrate';

export interface IMigrator {
  migrate(): Promise<void>;
}

interface IMigrationInfo {
  user_version: number;
  up: string;
  down: string;
}

export class Sqlite3Migrator implements IMigrator {
  private db: IDatabase;
  constructor(db: IDatabase) {
    this.db = db;
  }
  private async getCurrentVersion(): Promise<number> {
    return ((await this.db.getOne('PRAGMA user_version')) as any).user_version;
  }

  private async loadMigration(): Promise<IMigrationInfo[]> {
    return [migration_1, migration_2, migration_3, migration_4, migration_5];
  }

  public async migrate(): Promise<void> {
    const migrations = await this.loadMigration();
    let currentVersion = await this.getCurrentVersion();
    for (const migration of migrations) {
      if (migration.user_version > currentVersion) {
        await this.db.run(migration.up);
        currentVersion = migration.user_version;
      }
    }
    await this.db.run(`PRAGMA user_version = ${currentVersion}`);
  }
}
