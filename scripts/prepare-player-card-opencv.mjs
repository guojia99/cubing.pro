// Optional maintainer tool. Normal builds and browsers use the bundled runtime.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const directory = new URL('../public/vendor/opencv/4.11.0/', import.meta.url);
const metadata = JSON.parse(await readFile(new URL('provenance.json', directory), 'utf8'));
const files = await Promise.all(Object.entries(metadata.artifacts).map(async ([name, { url, sha256 }]) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== sha256) {
    throw new Error(`Official ${name} no longer matches the pinned SHA-256`);
  }
  return [name, bytes];
}));
for (const [name, bytes] of files) await writeFile(new URL(name, directory), bytes);
const cv = await createRequire(import.meta.url)('../public/vendor/opencv/4.11.0/opencv.js');
if (typeof cv.grabCut !== 'function' || !cv.getBuildInformation().includes('4.11.0')) {
  throw new Error('The pinned artifact does not expose the OpenCV 4.11.0 GrabCut binding');
}
console.log('Verified official OpenCV 4.11.0 GrabCut, runtime and license hashes.');
