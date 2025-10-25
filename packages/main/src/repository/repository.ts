import { logger } from '../../../common/logger';
import { Workspace } from '../entity/workspace';
import type { PaginationOptions } from './options';
import { WorkspaceInputData } from '../entity/workspace-input-data';
import { SSHConnection } from '../entity/ssh-connection';
import type { IDatabase } from './database';
import { Sqlite3Database } from './database';
import { Sqlite3Migrator } from './migrate';
import type { Parameter } from '../../../common/parameter';
import { ExecutionHistory } from '../entity/execution-history';

export class Repository {
  private isMigrated = false;
  private constructor(private db: IDatabase) {}

  public static init(dbPath: string): Repository {
    logger.debug('Repository.init()', { dbPath });
    const db = new Sqlite3Database(dbPath);
    return new Repository(db);
  }

  private async ensureMigrate(): Promise<void> {
    if (this.isMigrated) return;
    logger.debug('Repository.migrate()');
    const migrator = new Sqlite3Migrator(this.db);
    await migrator.migrate();
    this.isMigrated = true;
  }

  // --- Workspace CRUD ---

  public async createWorkspace(workspace: Workspace): Promise<Workspace> {
    await this.ensureMigrate();
    logger.debug('Repository.createWorkspace()', { workspace });

    const row = await this.db.getOne(
      `INSERT INTO workspaces (path, name, is_ssh) 
       VALUES (?, ?, ?) 
       RETURNING *`,
      [workspace.path, workspace.name, workspace.isSSH ? 1 : 0],
    );
    const created = Workspace.fromRow(row);

    // Nếu là SSH, lưu bản ghi kết nối
    if (workspace.isSSH && workspace.sshConnectionInfo) {
      await this.createSSHConnection(created.id, {
        ...workspace.sshConnectionInfo,
        port: workspace.sshConnectionInfo.port ?? 22,
      });
    }

    return created;
  }

  public async listWorkspaces(
    opts?: PaginationOptions,
  ): Promise<Workspace[]> {
    await this.ensureMigrate();
    logger.debug('Repository.listWorkspaces()', { opts });

    const limit  = opts?.limit  ?? 6;
    const offset = opts?.offset ?? 0;
    const rows = await this.db.getMany(
      `SELECT * FROM workspaces 
       ORDER BY last_used_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return rows.map(Workspace.fromRow);
  }

  public async getWorkspaceById(id: number): Promise<Workspace | null> {
    await this.ensureMigrate();
    logger.debug('Repository.getWorkspaceById()', { id });

    const row = await this.db.getOne(
      'SELECT * FROM workspaces WHERE id = ? LIMIT 1',
      [id],
    );
    if (!row) return null;

    const ws = Workspace.fromRow(row);

    if (ws.isSSH) {
      const ssh = await this.getSSHConnectionByWorkspaceId(id);
      // Unpack thành plain object với port và password bắt buộc
      ws.sshConnectionInfo = ssh
        ? {
            host: ssh.host,
            port: ssh.port,
            username: ssh.username,
            password: ssh.password ?? '',    // fallback tránh undefined
          }
        : null;
    }

    ws.inputData = await this.getWorkspaceInputDataByWorkspaceId(id);
    return ws;
  }


  public async getWorkspaceByDirectoryPath(dirPath: string): Promise<Workspace | null> {
    await this.ensureMigrate();
    logger.debug('Repository.getWorkspaceByDirectoryPath()', { dirPath });

    const row = await this.db.getOne(
      'SELECT * FROM workspaces WHERE path = ? LIMIT 1',
      [dirPath],
    );
    if (!row) return null;

    const ws = Workspace.fromRow(row);

    if (ws.isSSH) {
      const ssh = await this.getSSHConnectionByWorkspaceId(ws.id);
      ws.sshConnectionInfo = ssh
        ? {
            host: ssh.host,
            port: ssh.port,
            username: ssh.username,
            password: ssh.password ?? '',
          }
        : null;
    }

    ws.inputData = await this.getWorkspaceInputDataByWorkspaceId(ws.id);
    return ws;
  }


  public async removeWorkspace(id: number): Promise<void> {
    await this.ensureMigrate();
    logger.debug('Repository.removeWorkspace()', { id });

    // nhờ ON DELETE CASCADE, các record liên quan đều tự động bị xóa
    await this.db.run('DELETE FROM workspaces WHERE id = ?', [id]);
  }

  // --- SSH Connection CRUD ---

  public async createSSHConnection(
    workspaceId: number,
    info: { host: string; port: number; username: string; password: string },
  ): Promise<SSHConnection> {
    await this.ensureMigrate();
    logger.debug('Repository.createSSHConnection()', { workspaceId, info });

    const row = await this.db.getOne(
      `INSERT INTO ssh_connections 
         (workspace_id, host, port, username, password)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [workspaceId, info.host, info.port, info.username, info.password],
    );
    return SSHConnection.fromRow(row);
  }

  public async getSSHConnectionByWorkspaceId(
    workspaceId: number,
  ): Promise<SSHConnection | null> {
    await this.ensureMigrate();
    logger.debug('Repository.getSSHConnectionByWorkspaceId()', { workspaceId });

    const row = await this.db.getOne(
      `SELECT * FROM ssh_connections 
       WHERE workspace_id = ? LIMIT 1`,
      [workspaceId],
    );
    return row ? SSHConnection.fromRow(row) : null;
  }

  public async updateSSHConnection(
    workspaceId: number,
    info: { host?: string; port?: number; username?: string; password?: string },
  ): Promise<SSHConnection | null> {
    await this.ensureMigrate();
    logger.debug('Repository.updateSSHConnection()', { workspaceId, info });

    const sets: string[] = [];
    const params: any[] = [];
    if (info.host     !== undefined) { sets.push('host = ?');     params.push(info.host);     }
    if (info.port     !== undefined) { sets.push('port = ?');     params.push(info.port);     }
    if (info.username !== undefined) { sets.push('username = ?'); params.push(info.username); }
    if (info.password !== undefined) { sets.push('password = ?'); params.push(info.password); }
    if (!sets.length) return this.getSSHConnectionByWorkspaceId(workspaceId);

    params.push(workspaceId);
    await this.db.run(
      `UPDATE ssh_connections 
         SET ${sets.join(', ')}
       WHERE workspace_id = ?`,
      params,
    );
    return this.getSSHConnectionByWorkspaceId(workspaceId);
  }

  // --- Workspace Input Data ---

  public async getWorkspaceInputDataByWorkspaceId(
    workspaceId: number,
  ): Promise<WorkspaceInputData[]> {
    await this.ensureMigrate();
    logger.debug('Repository.getWorkspaceInputDataByWorkspaceId()', { workspaceId });

    const rows = await this.db.getMany(
      'SELECT * FROM workspace_input_data WHERE workspace_id = ?',
      [workspaceId],
    );
    return rows.map(WorkspaceInputData.fromRow);
  }

  public async createInputDataForWorkspace(
    workspaceId: number,
    inputData: WorkspaceInputData[],
  ): Promise<WorkspaceInputData[]> {
    await this.ensureMigrate();
    logger.debug('Repository.createInputDataForWorkspace()', { workspaceId, inputData });

    const inserted: WorkspaceInputData[] = [];
    for (const data of inputData) {
      const row = await this.db.getOne(
        `INSERT INTO workspace_input_data 
           (workspace_id, ref_name, type, input_path)
         VALUES (?, ?, ?, ?)
         RETURNING *`,
        [workspaceId, data.refName, data.type, data.inputPath],
      );
      inserted.push(WorkspaceInputData.fromRow(row));
    }
    return inserted;
  }

  // --- Execution History ---

  public async createExecutionHistory(
    workspaceId: number,
    sequenceNumber: number,
  ): Promise<ExecutionHistory> {
    await this.ensureMigrate();
    logger.debug('Repository.createExecutionHistory()', { workspaceId, sequenceNumber });

    const row = await this.db.getOne(
      `INSERT INTO execution_history 
         (workspace_id, parameters, seed, sequence_number)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
      [workspaceId, JSON.stringify({}), -1, sequenceNumber],
    );
    return ExecutionHistory.fromRow(row);
  }

  public async getExecutionHistoryByWorkspaceIdAndSequenceNumber(
    workspaceId: number,
    sequenceNumber: number,
  ): Promise<ExecutionHistory | null> {
    await this.ensureMigrate();
    logger.debug('Repository.getExecutionHistoryByWorkspaceIdAndSequenceNumber()', { workspaceId, sequenceNumber });

    const row = await this.db.getOne(
      `SELECT * FROM execution_history 
       WHERE workspace_id = ? AND sequence_number = ?`,
      [workspaceId, sequenceNumber],
    );
    return row ? ExecutionHistory.fromRow(row) : null;
  }

  public async getNextSequenceNumber(workspaceId: number): Promise<number> {
    await this.ensureMigrate();
    logger.debug('Repository.getNextSequenceNumber()', { workspaceId });

    const { sequenceNumber } = (await this.db.getOne(
      `SELECT MAX(sequence_number) AS sequenceNumber 
       FROM execution_history 
       WHERE workspace_id = ?`,
      [workspaceId],
    )) as any;
    return (sequenceNumber ?? -1) + 1;
  }

  public async updateExecutionHistory(
    workspaceId: number,
    sequenceNumber: number,
    parameter: Parameter,
    seed: number,
    sourceHash: string,
  ): Promise<ExecutionHistory | null> {
    await this.ensureMigrate();
    logger.debug('Repository.updateExecutionHistory()', { workspaceId, sequenceNumber });

    await this.db.run(
      `UPDATE execution_history 
         SET parameters = ?, seed = ?, source_hash = ?
       WHERE workspace_id = ? AND sequence_number = ?`,
      [JSON.stringify(parameter), seed, sourceHash, workspaceId, sequenceNumber],
    );
    return this.getExecutionHistoryByWorkspaceIdAndSequenceNumber(workspaceId, sequenceNumber);
  }
}
