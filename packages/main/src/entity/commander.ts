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

interface CommanderOptions {
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

    const command = `${this.binary} ${this.args.join(' ')}`;
    logger.debug(`[Commander] execute with command: ${command}`, {
      binary: this.binary,
      args: this.args,
      logFileName,
      useSSH: this.useSSH,
    });

    const logStream = createWriteStream(logFileName, { flags: 'a+' });

    if (this.useSSH) {
      try {
        const result = await ssh.execCommand(command);
        logStream.write(result.stdout ?? '');
        logStream.write(result.stderr ?? '');
        logStream.end();
        onFinish(0);
        return { logFile: logFileName, pid: -1 };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown SSH error';
        logStream.write(`[SSH ERROR]: ${message}`);
        logStream.end();
        logger.error('SSH command execution failed');
        onFinish(1);
        return { logFile: logFileName, pid: -1 };
      }
    }

    // Local execution via spawn
    const ls = spawn(this.binary, this.args, {
      ...this.spawnOptions,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (ls.pid === undefined) {
      ls.kill();
      logStream.end();
      throw new Error('Failed to run local command');
    }

    ls.stdout.pipe(logStream);
    ls.stderr.pipe(logStream);

    ls.on('exit', code => {
      logStream.end();
      onFinish(code);
    });

    ls.on('error', err => {
      logger.error('Local command execution error', err);
    });

    return {
      logFile: logFileName,
      pid: ls.pid,
    };
  }
}
