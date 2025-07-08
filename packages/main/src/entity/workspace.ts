import type { WorkspaceInputData } from './workspace-input-data';

export class Workspace {
  public id: number;
  public name: string;
  public createdAt: Date;
  public updatedAt: Date;
  public path: string;
  public inputData?: WorkspaceInputData[];
  public isSSH: boolean;
  public sshConnectionInfo?: {
    host: string;
    port?: number;
    username: string;
    password: string;
  } | null;

  constructor(name: string, path: string, isSSH: boolean, sshConnectionInfo?: {
      host: string;
      port?: number;
      username: string;
      password?: string;
    }) {
    this.sshConnectionInfo = sshConnectionInfo && sshConnectionInfo.password
      ? {
          host: sshConnectionInfo.host,
          port: sshConnectionInfo.port,
          username: sshConnectionInfo.username,
          password: sshConnectionInfo.password,
        }
      : null;
    this.id = -1;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.path = path;
    this.name = name;
    this.isSSH = isSSH;
  }

  public static fromRow(row: any): Workspace {
    return {
      id: row.id,
      path: row.path,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_used_at),
      isSSH: row.is_ssh,
      sshConnectionInfo: row.ssh_connection_info
        ? JSON.parse(row.ssh_connection_info)
        : null,
    };
  }
}
