import type { SpawnOptions } from './commander';
import { Commander } from './commander';

export class WhichCommander extends Commander {
  constructor(targetBinary: string, spawnOptions?: SpawnOptions) {
    if (process.platform === 'win32') {
      super('where', [targetBinary], {spawnOptions});
    } else {
      super('which', [targetBinary], {spawnOptions});
    }
  }

  public async test(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.execute(code => {
        if (code !== 0) {
          reject("Binary doesn't exist");
        }
        resolve(true);
      }).catch(e => {
        reject(e);
      });
    });
  }
}
