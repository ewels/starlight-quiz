import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';
import sharp from 'sharp';

// CanvasKit decodes bitmaps only, never SVG, so rasterise the wordmark at build
// time rather than committing a PNG that drifts from the real logo. `density`
// renders well above the target width so the mark survives the downscale —
// sharp's 72dpi default renders at intrinsic size and looks pixellated here.
const logo = 'node_modules/.astro/og-logo.png';
await sharp('src/assets/logo/starlight-quiz-horizontal-dark.svg', { density: 288 })
  .resize({ width: 900 })
  .png()
  .toFile(logo);

const entries = await getCollection('docs');

export const { getStaticPaths, GET } = await OGImageRoute({
  // Keys become the route: id `guides/cli` → /og/guides/cli.png
  pages: Object.fromEntries(entries.map((entry) => [entry.id, entry.data])),

  getImageOptions: (_path, page) => ({
    title: page.title,
    // `exactOptionalPropertyTypes` rejects `string | undefined` here.
    description: page.description ?? '',
    logo: { path: logo, size: [640] },
    bgGradient: [
      [26, 12, 41],
      [11, 8, 20],
    ],
    border: { color: [196, 155, 236], width: 16, side: 'inline-start' },
    padding: 60,
    fonts: [
      'https://api.fontsource.org/v1/fonts/sora/latin-600-normal.ttf',
      'https://api.fontsource.org/v1/fonts/sora/latin-400-normal.ttf',
    ],
    font: {
      title: { families: ['Sora'], weight: 'SemiBold', color: [237, 239, 244], size: 58, lineHeight: 1.3 },
      description: { families: ['Sora'], color: [176, 168, 196], size: 30, lineHeight: 1.4 },
    },
  }),
});
