import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseVersion, migratrVersion } from '../src/migratr/version';

const root = process.cwd();
const dist = join(root, 'dist');
const changelog = join(root, 'src/migratr/CHANGELOG.md');
const top = migratrVersion(changelog);

const pages = ['', 'cli/', 'migrations/', 'library/', 'changelog/'];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

describe('migratr pages', () => {
  it('reads the top version from the changelog copy', () => {
    expect(top).toMatch(/^\d+\.\d+\.\d+$/);
  });

  for (const page of pages) {
    it(`/migratr/${page} shows version ${top}`, () => {
      const html = readFileSync(join(dist, 'migratr', page, 'index.html'), 'utf8');
      expect(html).toContain(top);
    });
  }

  it('changelog page renders the changelog text', () => {
    const html = readFileSync(join(dist, 'migratr/changelog/index.html'), 'utf8');
    expect(html).toContain('The first release.');
  });
});

describe('_redirects', () => {
  const redirects = readFileSync(join(dist, '_redirects'), 'utf8');
  const target = 'https://raw.githubusercontent.com/rafters-studio/migratr/main/install.sh';
  const lines = redirects.split('\n').map((l) => l.trim().split(/\s+/).join(' '));

  it('has the two migratr lines', () => {
    expect(lines).toContain(`/migratr/install ${target} 302`);
    expect(lines).toContain(`/migratr/install.sh ${target} 302`);
  });

  it('keeps the existing /install line', () => {
    expect(lines).toContain(
      '/install https://raw.githubusercontent.com/rafters-studio/smugglr/main/install.sh 302',
    );
  });
});

describe('llms.txt', () => {
  const llms = readFileSync(join(dist, 'llms.txt'), 'utf8');
  const full = readFileSync(join(dist, 'llms-full.txt'), 'utf8');
  for (const page of pages) {
    it(`lists /migratr/${page}`, () => {
      expect(llms).toContain(`https://smugglr.dev/migratr/${page}`);
      expect(full).toContain(`https://smugglr.dev/migratr/${page}`);
    });
  }
});

describe('version helper', () => {
  it('throws naming the file when there is no version heading', () => {
    const dir = mkdtempSync(join(tmpdir(), 'migratr-'));
    const file = join(dir, 'CHANGELOG.md');
    writeFileSync(file, '# Changelog\n\nNothing yet.\n');
    expect(() => migratrVersion(file)).toThrow(file);
    expect(() => parseVersion('# x', 'CHANGELOG.md')).toThrow('CHANGELOG.md');
  });
});

const baseline = process.env['BASELINE_DIST'];

describe.skipIf(baseline === undefined)('existing pages are unchanged', () => {
  const excluded = new Set(['sitemap.xml', 'llms.txt', 'llms-full.txt', '_geo-audit.json']);
  const base = baseline ?? '';
  const files = baseline === undefined ? [] : walk(base).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const rel = relative(base, file);
    if (excluded.has(rel) || rel.startsWith('migratr/')) continue;
    it(`${rel} is byte-identical`, () => {
      expect(readFileSync(join(dist, rel), 'utf8')).toBe(readFileSync(file, 'utf8'));
    });
  }
});
