// One-off script: resize the source zine frames down to web-friendly JPEGs,
// numbered in final reading order, into public/zines/<slug>/.
// Each order.json entry is either a filename, or { file, half } where half
// ("left" | "right") crops that half out of a two-page spread image first —
// use this when the source frame is a whole spread rather than one page.
// `file` resolves against sourceDir unless it's an absolute path.
// Usage: node scripts/process-zine.mjs <order.json> <sourceDir> <slug>
import { readFile, mkdir } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import sharp from 'sharp';

const [, , orderPath, sourceDir, slug] = process.argv;
if (!orderPath || !sourceDir || !slug) {
	console.error('Usage: node scripts/process-zine.mjs <order.json> <sourceDir> <slug>');
	process.exit(1);
}

const { order } = JSON.parse(await readFile(orderPath, 'utf-8'));
const outDir = join('public', 'zines', slug);
await mkdir(outDir, { recursive: true });

let i = 0;
for (const entry of order) {
	const { file, half = null } = typeof entry === 'string' ? { file: entry } : entry;
	i += 1;
	const src = isAbsolute(file) ? file : join(sourceDir, file);
	const outName = `${String(i).padStart(2, '0')}.jpg`;
	const dest = join(outDir, outName);

	let image = sharp(src);
	if (half) {
		const { width, height } = await image.metadata();
		const mid = Math.round(width / 2);
		image =
			half === 'left'
				? image.extract({ left: 0, top: 0, width: mid, height })
				: image.extract({ left: mid, top: 0, width: width - mid, height });
	}

	await image
		.resize({ width: 1600, height: 2240, fit: 'inside', withoutEnlargement: true })
		.jpeg({ quality: 82, mozjpeg: true })
		.toFile(dest);
	console.log(`${file}${half ? ` (${half})` : ''} -> zines/${slug}/${outName}`);
}

console.log(`Done: ${i} pages written to ${outDir}`);
