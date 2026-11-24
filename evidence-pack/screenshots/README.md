# Application screenshots

## Capture status

No screenshots are included. Browser access to the locally served app at `http://127.0.0.1:8765` was declined by the origin approval gate, and the capture attempt stopped there. No mockups or generated images are being presented as application evidence.

## Add authentic screenshots locally

From the project root, run:

```powershell
python -m http.server 8765
```

Open `http://localhost:8765` in a browser and capture the actual rendered pages using the browser's built-in screenshot facility. Save the resulting, unaltered captures in this folder with descriptive names such as:

- `home.png` — landing page at the top of the page.
- `marketplace.png` — product grid with catalog content visible.
- `dashboard-overview.png` — dashboard overview after a demo business is registered and logged in.
- `registration.png` — registration form before submission, with no personal information entered.

If the dashboard requires a demo account, use synthetic demo values only and avoid capturing real personal data. Update this README with the capture date, browser/viewport, and a one-line description for each image. Embed each file here with Markdown, for example `![Marketplace page](marketplace.png)`. Do not label a screenshot as proof of a feature unless that behavior is visible in the capture.
