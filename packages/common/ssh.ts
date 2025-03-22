export interface SSHConnectionInfo {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
  }
  
  export interface SSHConnectionResponse {
    success: boolean;
    message: string;
    error?: string;
  }
  