# Image Viewer with Coverflow

Simple HTML5 app with a Node.js backend that serves images from the local `Images/Styles` folders.

How it works

- The server serves static files from `public/` and `Images/`.
- API endpoints:
  - `GET /api/sets` — lists available image sets (folders in `Images/Styles`).
  - `GET /api/sets/:setName/images` — lists swatch images and corresponding room image paths for the named set.

Run

1. Install dependencies:

```bash
npm install
```

2. Start server:

```bash
npm start
```

3. Open http://localhost:3000 in a browser.

Repository layout

- `server.js` — Express server
- `public/` — frontend assets (`index.html`, `app.js`, `styles.css`)
- `Images/Styles/...` — your existing image sets (not committed here)

Notes

- The app assumes the swatch and room images share the same filenames inside `Swatches/` and `Rooms/`.
- If a room image is missing the app will fall back to displaying the swatch.
