import { createHash } from 'node:crypto';
import { evaluateAsync } from '../src/connection.js';

const [scriptId, version] = process.argv.slice(2);
if (!scriptId || !version) {
  console.error('Usage: node scripts/verify_cloud_script.js "USER;<id>" "<version>"');
  process.exit(1);
}
if (!/^USER;[A-Za-z0-9]+$/.test(scriptId) || !/^\d+(?:\.\d+)?$/.test(version)) {
  console.error('Invalid script ID or version.');
  process.exit(1);
}

const url = JSON.stringify(`https://pine-facade.tradingview.com/pine-facade/get/${scriptId}/${version}`);
const result = await evaluateAsync(`
  fetch(${url}, { credentials: 'include' })
    .then(r => {
      if (!r.ok) throw new Error('Pine Facade returned HTTP ' + r.status);
      return r.json();
    })
    .then(d => ({
      title: d.scriptTitle || d.title || null,
      name: d.scriptName || d.name || null,
      source: d.source || ''
    }))
`);

const source = result.source;
console.log(JSON.stringify({
  title: result.title,
  name: result.name,
  sourceLength: source.length,
  lineCount: source.split('\n').length,
  sha256: createHash('sha256').update(source.replace(/\r\n?/g, '\n')).digest('hex'),
  firstLines: source.split('\n').slice(0, 3),
}, null, 2));
process.exit(0);
