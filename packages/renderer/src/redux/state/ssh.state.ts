export type SSHState = {
    username: string;
    server: string;
    password: string;
    isConnected: boolean;
    error?: string;
  };
  
  export const initialSSHState: SSHState = {
    username: '',
    server: '',
    password: '',
    isConnected: false,
  };