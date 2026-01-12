**Task:** Create a "Digital-to-Physical" sharing ecosystem for the pace calculator.

**1. Data Serialization:**
- Write a function to serialize all user inputs (Pace, Distance, Race Phases, Temperature, Elevation) into a URL query string.
- Use a lightweight compression (like LZ-String) if the URL exceeds 200 characters to keep the QR code simple and scannable.

**2. Poster & Pace Band Generator:**
- Create a "Export Center" modal.
- **Template 1 (Social Card):** 1:1 ratio, featuring the Apple Watch style dashboard and the "Decision Zone" highlight.
- **Template 2 (Pace Band):** A vertical or horizontal strip optimized for A4 printing, containing split times for every 5km.
- Include a high-contrast QR code in both templates using `qrcode.react`.

**3. Landing Logic:**
- Implement a `useLayoutEffect` or `useEffect` that checks for URL parameters on page load.
- If parameters exist, trigger an "Apply Shared Plan" animation where the Dashboard rings and sliders automatically move to the shared values.

**4. Multi-Language Footer:**
- Add a small text on the poster in the user's language: "Scanned from [YourSiteName] - Built for 2026 Marathons".