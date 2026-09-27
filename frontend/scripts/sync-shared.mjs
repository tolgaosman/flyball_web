import { copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const from = join(root, '..', 'backend', 'resources', 'shared');
const to = join(root, 'src', 'shared');

for (const file of readdirSync(from).filter((f) => f.endsWith('.json'))) {
  copyFileSync(join(from, file), join(to, file));
}
