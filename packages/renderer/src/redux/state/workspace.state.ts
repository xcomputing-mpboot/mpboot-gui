export const initialWorkspaceState = {
  dirPath: '',
  name: '',
  id: -1,
};

export type WorkspaceState = {
  dirPath: string;
  name: string;
  id: number;
  isSSH : boolean;
  sshConnectionInfo: {
    host: string;
    port: number;
    username: string;
    password: string;
  } | null;
};
