export type SSHState = {
    username: string;
    host: string;
    password: string;
    isConnected: boolean;
    error?: string;
    currentPath?: string;
    selectedPath?: string;
  };
  
  export const initialSSHState: SSHState = {
    username: '',
    host: '',
    password: '',
    isConnected: false,
    currentPath: '',
    selectedPath: '',
  };