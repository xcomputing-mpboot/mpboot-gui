import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';

dotenv.config();

await writeFile(
  'packages/main/src/inject-env.ts',
  `export default ${JSON.stringify({
    PUBLIC_GITHUB_TOKEN: process.env.PUBLIC_GITHUB_TOKEN || '',
  })}`,
);
