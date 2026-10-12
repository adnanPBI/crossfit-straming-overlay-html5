import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';

const asset = path => new URL('../public/' + path, import.meta.url);

// Run before deployment so a partial Git tree cannot silently drop the
// homepage or a file referenced by the default broadcast layout.
test('published homepage redirects to the live control dashboard', async () => {
  const homepage = await readFile(asset('index.html'), 'utf8');
  assert.match(homepage, /<meta\s+http-equiv="refresh"\s+content="0;url=\/control"/i);
  assert.match(homepage, /<a\s+href="\/control"/i);
  const controller = await readFile(asset('control.html'), 'utf8');
  assert.match(controller, /WOD Stream Studio/);
});

test('Netlify publish directory includes all public entrypoints and default logo', async () => {
  for (const file of [
    'index.html', 'control.html', 'overlay.html', 'remote.html',
    'css/control.css', 'css/overlay.css', 'css/remote.css',
    'js/api.js', 'js/control.js', 'js/overlay.js', 'js/remote.js',
    'js/defaults.js', 'js/i18n.js', 'js/timer-engine.js', 'js/formula-v2.js',
    'sample-logo.png'
  ]) {
    const info = await stat(asset(file));
    assert.ok(info.isFile() && info.size > 0, 'Missing or empty: public/' + file);
  }
  const png = await readFile(asset('sample-logo.png'));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});
