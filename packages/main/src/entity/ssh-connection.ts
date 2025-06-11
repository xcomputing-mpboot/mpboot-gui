// packages/main/src/entity/ssh-connection.ts

import type { SSHConnectionInfo } from '../../../common/ssh';

export interface SSHConnectionRow extends SSHConnectionInfo {
  id: number;
  workspace_id: number;
}

export class SSHConnection {
  id: number;
  workspaceId: number;
  host: string;
  port?: number;
  username: string;
  password: string;
  privateKey?: string;
  passphrase?: string;

  constructor(row: SSHConnectionRow) {
    this.id          = row.id;
    this.workspaceId = row.workspace_id;
    this.host        = row.host;
    // vì interface cho port là optional, nhưng DB luôn có NOT NULL
    this.port        = row.port!;
    this.username    = row.username;
    this.password    = row.password ?? '';
    this.privateKey  = row.privateKey;
    this.passphrase  = row.passphrase;
  }

  static fromRow(row: any): SSHConnection {
    return new SSHConnection({
      id:            row.id,
      workspace_id:  row.workspace_id,
      host:          row.host,
      port:          row.port,
      username:      row.username,
      password:      row.password,
      privateKey:    row.privateKey,
      passphrase:    row.passphrase,
    });
  }

  toInfo(): SSHConnectionInfo {
    return {
      host:       this.host,
      port:       this.port,
      username:   this.username,
      password:   this.password,
      privateKey: this.privateKey,
      passphrase: this.passphrase,
    };
  }
}
