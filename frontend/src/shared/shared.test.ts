import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const backendShared = join(__dirname, '..', '..', '..', 'backend', 'resources', 'shared');

describe('shared contract', () => {
  const files = readdirSync(backendShared).filter((f) => f.endsWith('.json'));

  it('has every backend file', () => {
    expect(files.sort()).toEqual(['account_rules.json', 'clubs.json', 'competitions.json', 'countries.json']);
  });

  it.each(files)('%s matches backend/resources/shared (run `npm run sync-shared`)', (file) => {
    const local = readFileSync(join(__dirname, file), 'utf8');
    const canonical = readFileSync(join(backendShared, file), 'utf8');
    expect(local).toBe(canonical);
  });
});
