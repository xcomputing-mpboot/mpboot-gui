import { spawn, exec } from 'child_process';
import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
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
  hpcOptions?: {
    submitCommand?: string;
    checkCommand?: string;
    submitTemplate?: string;
  };
  eventSender?: any;
}

export class Commander {
  protected binary: string;
  protected args: string[];
  private spawnOptions?: SpawnOptions;
  private useSSH: boolean;
  private hpcOptions?: {
    submitCommand?: string;
    checkCommand?: string;
    submitTemplate?: string;
  };
  private eventSender?: any;

  constructor(binary: string, args: string[], options?: CommanderOptions) {
    this.binary = binary;
    this.args = args;
    this.spawnOptions = options?.spawnOptions;
    this.useSSH = options?.useSSH ?? false;
    this.hpcOptions = options?.hpcOptions;
    this.eventSender = options?.eventSender;
  }

  private isHpcEnabled(): boolean {
    return !!(
      this.hpcOptions?.submitCommand &&
      this.hpcOptions?.checkCommand &&
      this.hpcOptions?.submitTemplate
    );
  }

  private async submitHpcJob(commandStr: string): Promise<string> {
    if (!this.hpcOptions?.submitCommand || !this.hpcOptions?.submitTemplate) {
      throw new Error('HPC options not configured');
    }

    const { submitCommand, submitTemplate } = this.hpcOptions;
    
    // Replace {command} placeholder in template with actual command
    const jobScript = submitTemplate.replace(/{command}/g, commandStr);
    
    const timestamp = Date.now();
    const jobScriptPath = `/tmp/mpboot_job_${timestamp}.sh`;
    
    const writeScriptCommand = `cat > ${jobScriptPath} << 'EOF'
${jobScript}
EOF`;
    
    await ssh.execCommand(writeScriptCommand);
    
    await ssh.execCommand(`chmod +x ${jobScriptPath}`);
    
    const submitResult = await ssh.execCommand(`${submitCommand} ${jobScriptPath}`);
    
    await ssh.execCommand(`rm -f ${jobScriptPath}`);
    
    if (submitResult.code !== 0) {
      throw new Error(`HPC job submission failed: ${submitResult.stderr || submitResult.stdout}`);
    }
    
    return submitResult.stdout.trim();
  }

  private async checkHpcJobStatus(jobId: string): Promise<{ isRunning: boolean; output: string; jobState?: string }> {
    if (!this.hpcOptions?.checkCommand) {
      throw new Error('HPC check command not configured');
    }
    
    const checkCommand = this.hpcOptions.checkCommand.replace(/{job_id}/g, jobId);
    const result = await ssh.execCommand(checkCommand);
    
    // For SLURM-specific logic
    if (this.hpcOptions.submitCommand?.includes('sbatch')) {
      const lines = result.stdout.trim().split('\n').filter(line => line.trim());
      
      if (lines.length > 1) {
        const jobDataLine = lines[1];
        const stateMatch = jobDataLine.match(/\s+(PD|R|CG|CD|CA|F|TO|NF|RV|SE)\s+/);
        if (stateMatch) {
          const slurmState = stateMatch[1];
          const runningStates = ['PD', 'R', 'CG'];
          const isRunning = runningStates.includes(slurmState);
          
          return {
            isRunning,
            output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
            jobState: `SLURM_${slurmState}`,
          };
        }
        
        return {
          isRunning: true,
          output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
          jobState: 'SLURM_UNKNOWN',
        };
      } else {
        return {
          isRunning: false,
          output: result.stdout + (result.stderr ? '\n' + result.stderr : '') + '\n[Status: Job completed - not found in queue]',
          jobState: 'COMPLETED',
        };
      }
    }
    
    // For PBS-specific logic
    if (this.hpcOptions.submitCommand?.includes('qsub') || this.hpcOptions.checkCommand?.includes('qstat')) {
      const lines = result.stdout.trim().split('\n').filter(line => line.trim());
      
      if (lines.length > 2) { 
        const jobDataLine = lines[2];

        const columns = jobDataLine.split(/\s+/);
        if (columns.length >= 5) {
          const pbsState = columns[4]; 
          
          // PBS job states: Q=Queued, R=Running, C=Completed, E=Exiting, H=Held, W=Waiting, T=Transit, S=Suspend
          const runningStates = ['Q', 'R', 'W', 'T', 'H', 'S'];
          
          const isRunning = runningStates.includes(pbsState);
          
          return {
            isRunning,
            output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
            jobState: `PBS_${pbsState}`,
          };
        }
        
        return {
          isRunning: true,
          output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
          jobState: 'PBS_UNKNOWN',
        };
      } else {
        return {
          isRunning: false,
          output: result.stdout + (result.stderr ? '\n' + result.stderr : '') + '\n[Status: Job completed - not found in queue]',
          jobState: 'COMPLETED',
        };
      }
    }
    
    const isRunning = result.code === 0 && result.stdout.trim().length > 0;
    
    return {
      isRunning,
      output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
    };
  }

  private async monitorHpcJob(
    jobId: string, 
    logFileName: string, 
    onFinish: (exitCode?: number | null) => void,
    refreshOptions?: { eventSender?: any; useSSH?: boolean },
  ): Promise<void> {
    const checkInterval = 30000;
    const maxChecks = 240;
    let checkCount = 0;
    
    const monitor = async () => {
      try {
        checkCount++;
        const status = await this.checkHpcJobStatus(jobId);
        
        const statusUpdate = `\n=== Job Status Check ${checkCount} at ${new Date().toISOString()} ===\n${status.output}\n`;
        const currentLog = await require('fs/promises').readFile(logFileName, 'utf8');
        await writeFile(logFileName, currentLog + statusUpdate);
        
        if (!status.isRunning) {
          logger.debug(`HPC job ${jobId} completed after ${checkCount} checks`);

          const isError = status.output.toLowerCase().includes('error') || 
                         status.output.toLowerCase().includes('failed') ||
                         status.output.toLowerCase().includes('cancelled');
          
          const finalUpdate = `\n=== Job Completed ===\nJob ${jobId} finished. Status: ${isError ? 'Failed' : 'Success'}\n`;
          const finalLog = await require('fs/promises').readFile(logFileName, 'utf8');
          await writeFile(logFileName, finalLog + finalUpdate);
          
          if (refreshOptions?.eventSender && refreshOptions?.useSSH) {
            refreshOptions.eventSender.send('ssh-directory-refresh', { 
              message: 'HPC job execution completed, refresh SSH directory tree', 
            });
          }
          
          onFinish(isError ? 1 : 0);
          return;
        }
        
        if (checkCount >= maxChecks) {
          logger.warn(`HPC job ${jobId} monitoring timeout after ${maxChecks} checks`);
          const timeoutUpdate = `\n=== Monitoring Timeout ===\nJob ${jobId} monitoring stopped after ${checkCount} checks (${(checkCount * checkInterval) / 1000 / 60} minutes)\n`;
          const timeoutLog = await require('fs/promises').readFile(logFileName, 'utf8');
          await writeFile(logFileName, timeoutLog + timeoutUpdate);
          onFinish(1);
          return;
        }
        
        setTimeout(monitor, checkInterval);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error monitoring HPC job ${jobId}: ${errorMessage}`);
        const errorUpdate = `\n=== Monitoring Error ===\nError checking job status: ${errorMessage}\n`;
        try {
          const errorLog = await require('fs/promises').readFile(logFileName, 'utf8');
          await writeFile(logFileName, errorLog + errorUpdate);
        } catch (logError) {
          const logErrorMessage = logError instanceof Error ? logError.message : 'Unknown log error';
          logger.error(`Failed to write error to log: ${logErrorMessage}`);
        }
        onFinish(1);
      }
    };

    setTimeout(monitor, 5000);
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
  //join fix
  const logFileName = tmpdir() + `mpbootgui-${Date.now()}.log`;
  await writeFile(logFileName, '');

  const commandStr = [this.binary, ...(this.args || [])].join(' ');
  logger.debug('Executing command:', commandStr);

  logger.debug('Log file', {
    binary: this.binary,
    args: this.args,
    logFileName,
  });

  if (this.useSSH) {
    try {
      let mpbootPath = this.binary;
      
      if (this.binary === 'mpboot') {
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

        if (mpbootPath === 'mpboot') {
          const debugResult = await ssh.execCommand('bash -l -c \'echo "PATH: $PATH"; ls -la /usr/local/bin/ | grep -i mpboot || echo "No mpboot in /usr/local/bin"\'');
          logger.debug(`Debug mpboot search: ${debugResult.stdout}`);
        }
      }
      
      const fullCommandStr = [mpbootPath, ...(this.args || [])].join(' ');
      
      const workingDir = this.spawnOptions?.cwd;
      let fullCommand = fullCommandStr;
      
      if (workingDir) {
        const checkDirResult = await ssh.execCommand(`test -d "${workingDir}" && echo "Directory exists" || echo "Directory missing"`);
        logger.debug(`SSH directory check: ${checkDirResult.stdout.trim()}`);
        
        if (checkDirResult.stdout.trim() !== 'Directory exists') {
          throw new Error(`SSH working directory does not exist: ${workingDir}`);
        }
        
        fullCommand = `bash -l -c 'export PATH="$HOME/.config/mpboot/bin:$PATH"; cd "${workingDir}" && ${fullCommandStr}'`;
      } else {
        fullCommand = `bash -l -c 'export PATH="$HOME/.config/mpboot/bin:$PATH"; ${fullCommandStr}'`;
      }
      
      if (this.isHpcEnabled()) {
        logger.debug('HPC mode enabled, submitting job to scheduler');
        
        const jobSubmissionOutput = await this.submitHpcJob(fullCommand);
        
        let jobId = '';
        
        if (this.hpcOptions?.submitCommand?.includes('qsub')) {
          const pbsJobMatch = jobSubmissionOutput.match(/(\d+)(?:\.\w+)?/);
          if (pbsJobMatch) {
            jobId = pbsJobMatch[0];
          }
        } else {
          const jobIdMatches = jobSubmissionOutput.match(/(\d+)/);
          if (jobIdMatches) {
            jobId = jobIdMatches[1];
          }
        }
        
        const logContent = [
          '=== HPC Job Submission Log ===',
          `Timestamp: ${new Date().toISOString()}`,
          `Original binary: ${this.binary}`,
          `Resolved MPBoot Path: ${mpbootPath}`,
          `Command: ${fullCommand}`,
          `Working directory: ${workingDir || 'default'}`,
          `Submit command: ${this.hpcOptions?.submitCommand}`,
          `Job ID: ${jobId}`,
          '',
          '=== Job submission output ===',
          jobSubmissionOutput,
          '',
          '=== Monitoring job status ===',
        ].join('\n');
        
        await writeFile(logFileName, logContent);
        
        this.monitorHpcJob(jobId, logFileName, onFinish, {
          eventSender: this.eventSender,
          useSSH: this.useSSH,
        });
        
        return {
          logFile: logFileName,
          pid: Date.now(),
        };
      } else {
        logger.debug(`SSH executing: ${fullCommand}`);
        const result = await ssh.execCommand(fullCommand);

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
        
        const exitCode = result.stderr && result.stderr.length > 0 ? 1 : 0;
        
        logger.debug(`SSH execution completed with exit code: ${exitCode}`);
        
        setTimeout(() => onFinish(exitCode), 100);
        
        return {
          logFile: logFileName,
          pid: Date.now(),
        };
      }
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
