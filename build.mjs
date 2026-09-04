import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const project = process.cwd();
const output = join(project, 'dist');
const entries = ['index.html', '404.html', 'assets', 'css', 'js', 'data', 'admin', 'pages', 'led-mode'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of entries) {
  await cp(join(project, entry), join(output, entry), { recursive: true });
}
console.log(`TAGLISAYAHAN build complete: ${entries.length} deployment entries copied.`);
