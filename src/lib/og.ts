import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import satori from 'satori';
import sharp from 'sharp';

// Loaded once per build. Satori converts text to vector <path> data, so the
// rasterized PNG is self-contained and needs no font at render time.
// Read from the project root (build cwd) rather than a bundled URL so the font
// resolves after Vite bundles this module.
const fontData = readFileSync(path.join(process.cwd(), 'src/assets/og/Pretendard-Bold.otf'));

const SITE_LABEL = 'chocobreeze.github.io';

// Longer titles get a smaller size so they stay within the card.
function titleFontSize(title: string): number {
	if (title.length > 45) return 46;
	if (title.length > 30) return 56;
	return 66;
}

export async function renderOgImage({
	title,
	category,
}: {
	title: string;
	category?: string;
}): Promise<Buffer> {
	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '72px 80px',
					background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
					color: '#f8fafc',
				},
				children: [
					{
						type: 'div',
						props: {
							style: { fontSize: 30, color: '#38bdf8', letterSpacing: '0.04em' },
							children: (category ?? 'Blog').toUpperCase(),
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								fontSize: titleFontSize(title),
								lineHeight: 1.25,
								// Cap runaway titles at three lines with an ellipsis.
								lineClamp: 3,
							},
							children: title,
						},
					},
					{
						type: 'div',
						props: {
							style: { fontSize: 28, color: '#94a3b8' },
							children: SITE_LABEL,
						},
					},
				],
			},
		},
		{
			width: 1200,
			height: 630,
			fonts: [{ name: 'Pretendard', data: fontData, weight: 700, style: 'normal' }],
		},
	);

	return sharp(Buffer.from(svg)).png().toBuffer();
}
