// One-off script: resize the full (unsplit) two-page spread photos for a
// zine into public/zines/<slug>/spreads/, in reading order, for use as a
// hover-carousel background on the zine selection page. Unlike
// process-zine.mjs, these are NOT cropped into left/right reader pages —
// the carousel wants each spread as one continuous image.
// Usage: node scripts/build-spread-carousel.mjs <manifest.json> <sourceDir> <slug>
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const [, , manifestPath, sourceDir, slug] = process.argv;
if (!manifestPath || !sourceDir || !slug) {
	console.error('Usage: node scripts/build-spread-carousel.mjs <manifest.json> <sourceDir> <slug>');
	process.exit(1);
}

const { frames } = JSON.parse(await readFile(manifestPath, 'utf-8'));
const outDir = join('public', 'zines', slug, 'spreads');
await mkdir(outDir, { recursive: true });

let i = 0;
for (const file of frames) {
	i += 1;
	const src = join(sourceDir, file);
	const outName = `${String(i).padStart(2, '0')}.jpg`;
	const dest = join(outDir, outName);

	await sharp(src)
		.resize({ width: 2000, withoutEnlargement: true })
		.jpeg({ quality: 78, mozjpeg: true })
		.toFile(dest);
	console.log(`${file} -> zines/${slug}/spreads/${outName}`);
}

console.log(`Done: ${i} spreads written to ${outDir}`);
