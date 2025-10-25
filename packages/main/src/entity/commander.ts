import { spawn, exec } from 'child_process';
import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { logger } from '../../../common/logger';
import { ssh } from '../ipc/ssh.ipc';

export interface ExecuteResult {
  logFile: string;
  pid: number;
}

export interface SpawnOptions {
  cwd?: string;
}

export interface CommanderOptions {
  useSSH?: boolean;
  spawnOptions?: SpawnOptions;
}

export class Commander {
  protected binary: string;
  protected args: string[];
  private spawnOptions?: SpawnOptions;
  private useSSH: boolean;

  constructor(binary: string, args: string[], options?: CommanderOptions) {
    this.binary = binary;
    this.args = args;
    this.spawnOptions = options?.spawnOptions;
    this.useSSH = options?.useSSH ?? false;
  }

  public async executeInline(): Promise<string> {
    const command = `${this.binary} ${this.args.join(' ')}`;
    logger.debug(`[Commander] executeInline with command: ${command}`);

    if (this.useSSH) {
      try {
        const result = await ssh.execCommand(command);
        if (result.stderr && result.stderr.length > 0) {
          logger.warn('SSH stderr:', result.stderr);
        }
        return result.stdout;
      } catch (error) {
        logger.error('SSH command execution failed');
        throw new Error(
          error instanceof Error ? error.message : 'Unknown SSH execution error',
        );
      }
    }

    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, _stderr) => {
        if (err) {
          logger.error('Error when exec command', err);
          reject(err);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  public async execute(onFinish: (exitCode?: number | null) => void): Promise<ExecuteResult> {
  const logFileName = join(tmpdir(), `mpbootgui-${Date.now()}.log`);
  await writeFile(logFileName, '');

  // Ghép binary và args thành lệnh hoàn chỉnh
  const commandStr = [this.binary, ...(this.args || [])].join(' ');
  logger.debug('Executing command:', commandStr);

  logger.debug('Log file', {
    binary: this.binary,
    args: this.args,
    logFileName,
  });

  // Handle SSH execution
  if (this.useSSH) {
    try {
      // First, find the full path to mpboot on the SSH server
      let mpbootPath = this.binary;
      
      if (this.binary === 'mpboot') {
        // Try multiple methods to find mpboot
        const findMethods = [
          'which mpboot 2>/dev/null',
          'command -v mpboot 2>/dev/null', 
          'find /usr/local/bin /usr/bin /opt -name "mpboot" 2>/dev/null | head -1',
          'ls -la ~/.local/bin/mpboot 2>/dev/null | awk \'{print $NF}\'',
          'echo $PATH | tr ":" "\\n" | xargs -I {} find {} -name "mpboot" 2>/dev/null | head -1',
        ];
        
        for (const method of findMethods) {
          const findResult = await ssh.execCommand(`bash -l -c '${method}'`);
          if (findResult.stdout && findResult.stdout.trim()) {
            mpbootPath = findResult.stdout.trim();
            logger.debug(`Found mpboot at: ${mpbootPath} using method: ${method}`);
            break;
          }
        }
        
        // If still not found, log available executables for debugging
        if (mpbootPath === 'mpboot') {
          const debugResult = await ssh.execCommand('bash -l -c \'echo "PATH: $PATH"; ls -la /usr/local/bin/ | grep -i mpboot || echo "No mpboot in /usr/local/bin"\'');
          logger.debug(`Debug mpboot search: ${debugResult.stdout}`);
        }
      }
      
      // Rebuild command with found path
      const fullCommandStr = [mpbootPath, ...(this.args || [])].join(' ');
      
      // Set working directory if specified in spawnOptions
      const workingDir = this.spawnOptions?.cwd;
      let fullCommand = fullCommandStr;
      
      if (workingDir) {
        // First verify the directory exists and is accessible
        const checkDirResult = await ssh.execCommand(`test -d "${workingDir}" && echo "Directory exists" || echo "Directory missing"`);
        logger.debug(`SSH directory check: ${checkDirResult.stdout.trim()}`);
        
        if (checkDirResult.stdout.trim() !== 'Directory exists') {
          throw new Error(`SSH working directory does not exist: ${workingDir}`);
        }
        
        fullCommand = `bash -l -c 'export PATH="$HOME/.config/mpboot/bin:$PATH"; cd "${workingDir}" && ${fullCommandStr}'`;
      } else {
        fullCommand = `bash -l -c 'export PATH="$HOME/.config/mpboot/bin:$PATH"; ${fullCommandStr}'`;
      }
      
      logger.debug(`SSH executing: ${fullCommand}`);
      const result = await ssh.execCommand(fullCommand);
      
      // Write comprehensive output to log file
      const logContent = [
        '=== SSH Command Execution Log ===',
        `Timestamp: ${new Date().toISOString()}`,
        `Original Binary: ${this.binary}`,
        `Resolved MPBoot Path: ${mpbootPath}`,
        `Command: ${fullCommand}`,
        `Working Directory: ${workingDir || 'default'}`,
        '',
        '=== STDOUT ===',
        result.stdout || '(no output)',
        '',
        '=== STDERR ===', 
        result.stderr || '(no errors)',
        '',
        '=== Execution completed ===',
      ].join('\n');
      
      await writeFile(logFileName, logContent);
      
      // Determine exit code based on stderr (simple heuristic)
      const exitCode = result.stderr && result.stderr.length > 0 ? 1 : 0;
      
      logger.debug(`SSH execution completed with exit code: ${exitCode}`);
      
      // Call onFinish immediately since SSH command has completed
      setTimeout(() => onFinish(exitCode), 100);
      
      return {
        logFile: logFileName,
        pid: Date.now(), // Use timestamp as fake PID for SSH
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SSH execution error';
      logger.error('SSH command execution failed: ' + errorMessage);
      
      const errorLogContent = [
        '=== SSH Command Execution Error ===',
        `Timestamp: ${new Date().toISOString()}`,
        `Original Binary: ${this.binary}`,
        `Command: ${commandStr}`,
        `Error: ${errorMessage}`,
        '',
        '=== Execution failed ===',
      ].join('\n');
      
      await writeFile(logFileName, errorLogContent);
      setTimeout(() => onFinish(1), 100);
      
      return {
        logFile: logFileName,
        pid: Date.now(),
      };
    }
  }

  // Original local execution
  const logStream = createWriteStream(logFileName, { flags: 'a+' });
  const ls = spawn(this.binary, this.args, {
    ...this.spawnOptions,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (ls.pid === undefined) {
    ls.kill();
    logStream.end();
    throw new Error('Failed to run command');
  }

  ls.stdout.pipe(logStream);
  ls.stderr.pipe(logStream);

  ls.on('exit', _code => {
    logStream.end();
    onFinish(_code);
  });
  ls.on('error', err => {
    logger.error('Failed to run command', err);
  });

  return {
    logFile: logFileName,
    pid: ls.pid,
  };
}
}
