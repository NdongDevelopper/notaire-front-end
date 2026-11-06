# PWA Icons Instructions

The Vite PWA plugin expects the following icon files in the public folder:
- `pwa-192x192.png` - 192x192 pixel PNG icon
- `pwa-512x512.png` - 512x512 pixel PNG icon

For now, these are placeholder files. For production, you should:

1. Create proper PNG icons with your app logo
2. Place them in the `public/` folder
3. The icons should be:
   - 192x192 pixels for the smaller icon
   - 512x512 pixels for the larger icon
   - PNG format with transparent background recommended
   - High quality and readable at small sizes

You can use tools like:
- Online generators: https://www.pwabuilder.com/imageGenerator
- Design tools: Figma, Photoshop, Canva
- CLI tools: `sharp` or `imagemagick`
