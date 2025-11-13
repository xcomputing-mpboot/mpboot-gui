export type SSHState = {
    username: string;
    host: string;
    port: number;
    password: string;
    isConnected: boolean;
    error?: string;
    currentPath?: string;
    selectedPath?: string;
    remoteOS?: string;
  };
  
  export const initialSSHState: SSHState = {
    username: '',
    host: '',
    port: 22,
    password: '',
    isConnected: false,
    currentPath: '',
    selectedPath: '',
    remoteOS: undefined,
  };