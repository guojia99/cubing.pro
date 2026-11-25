import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const version = '4.11.0';
const commit = '31b0eeea0b44b370fd0712312df4214d4ae1b158';
const epoch = '1736352078';
const modules = ['core', 'imgproc', 'js'];
const root = resolve(import.meta.dirname, '..');
const config = join(import.meta.dirname, 'player-card-opencv.config.py');
const vendor = join(root, 'public/vendor/opencv', version);
const tool = process.env.OPENCV_BUILD_TOOL ?? 'docker';
assert.ok(['docker', 'local'].includes(tool), 'OPENCV_BUILD_TOOL must be docker or local');

await mkdir(join(root, 'var'), { recursive: true });
const scratch = await mkdtemp(join(root, 'var/opencv-build-'));
try {
  const src = process.env.OPENCV_SRC_DIR ? resolve(process.env.OPENCV_SRC_DIR) : join(scratch, 'src');
  if (!process.env.OPENCV_SRC_DIR) {
    execFileSync('git', ['clone', '--depth=1', '--branch', version, 'https://github.com/opencv/opencv.git', src], { stdio: 'inherit' });
    assert.equal(execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit);
  }

  const stage = join(scratch, 'stage');
  await mkdir(stage);
  const file = 'opencv.js';
  const staged = join(stage, file);
  const flags = [
    `--cmake_option=-DBUILD_LIST=${modules.join(',')}`,
    '--cmake_option=-DBUILD_ZLIB=OFF', '--cmake_option=-DWITH_QUIRC=OFF',
    '--cmake_option=-DBUILD_ITT=OFF', '--cmake_option=-DWITH_IPP=OFF',
    '--cmake_option=-DENABLE_PIC=FALSE',
  ];
  if (tool === 'docker') {
    execFileSync('docker', [
      'run', '--rm', ...(process.arch === 'x64' ? [] : ['--platform=linux/amd64']),
      '-e', `SOURCE_DATE_EPOCH=${epoch}`, '-v', `${src}:/opencv:ro`,
      '-v', `${config}:/config.py:ro`, '-v', `${stage}:/stage`, 'emscripten/emsdk:3.1.64',
      'sh', '-ec', 'emcmake python3 /opencv/platforms/js/build_js.py /tmp/build "$@" && cp /tmp/build/bin/opencv.js /stage/',
      'build', '--config=/config.py', ...flags,
    ], { stdio: 'inherit' });
  } else {
    const build = join(scratch, 'build');
    execFileSync('emcmake', ['python3', join(src, 'platforms/js/build_js.py'), build, `--config=${config}`, ...flags], {
      stdio: 'inherit', env: { ...process.env, SOURCE_DATE_EPOCH: epoch },
    });
    await copyFile(join(build, 'bin', file), staged);
  }

  const cv = await createRequire(import.meta.url)(staged);
  const build = cv.getBuildInformation();
  assert.ok(build.includes(`OpenCV ${version}`), 'Unexpected OpenCV version');
  const builtModules = build.match(/^\s*To be built:[ \t]*(.+)$/m)?.[1].trim().split(/\s+/);
  assert.deepEqual(builtModules?.sort(), modules, 'Unexpected compiled OpenCV modules');
  smokeTest(cv);

  const binary = await readFile(staged);
  const bytes = binary.length;
  const gzipBytes = gzipSync(binary).length;
  const manifest = join(vendor, 'provenance.json');
  const provenance = JSON.parse(await readFile(manifest, 'utf8'));
  delete provenance.artifacts[file];
  Object.assign(provenance, { version, modified: false, build, runtime: {
    file, sha256: sha256(binary), bytes, gzipBytes, modules, configHash: sha256(await readFile(config)),
  } });
  await copyFile(staged, join(vendor, file));
  await writeFile(manifest, `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(`${file}: ${bytes} bytes raw, ${gzipBytes} bytes gzip`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function smokeTest(cv) {
  const side = 8;
  const pixels = Array.from({ length: side * side }, (_, index) => index % side < 4 ? 20 : 220);
  const labels = [cv.GC_BGD, cv.GC_BGD, cv.GC_BGD, cv.GC_PR_FGD, cv.GC_PR_BGD, cv.GC_FGD, cv.GC_FGD, cv.GC_FGD];
  const mats = [];
  const own = (mat) => { mats.push(mat); return mat; };
  try {
    const rgba = own(cv.matFromArray(side, side, cv.CV_8UC4, pixels.flatMap(value => [value, 0, 0, 255])));
    const rgb = own(new cv.Mat());
    const mask = own(cv.matFromArray(side, side, cv.CV_8UC1, pixels.map((_, index) => labels[index % side])));
    const background = own(new cv.Mat());
    const foreground = own(new cv.Mat());
    cv.setRNGSeed(0);
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
    assert.equal(rgb.channels(), 3);
    cv.grabCut(rgb, mask, new cv.Rect(0, 0, side, side), background, foreground, 1, cv.GC_INIT_WITH_MASK);
    assert.equal(mask.data[3], cv.GC_PR_BGD);
    assert.equal(mask.data[4], cv.GC_PR_FGD);
  } finally {
    for (const mat of mats) mat.delete();
  }
}
