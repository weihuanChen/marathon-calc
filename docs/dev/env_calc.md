**Role:** Senior Sports Science Algorithm Engineer & Frontend Developer.
**Task:** Implement a professional environment-adjustment logic for the pace calculator.

**1. Create an Adjustment Engine (`environmentEngine.js`):**
Implement a function `getAdjustedPace(basePaceInSeconds, params)` using the following logic:
- **Base:** Start with `adjustedPace = basePaceInSeconds`.
- **Elevation:** - If `gain > 0`, `adjustedPace += (gain / totalDistance) * 6.0 * basePaceInSeconds`.
  - If `loss > 0`, `adjustedPace -= (loss / totalDistance) * 3.5 * basePaceInSeconds`.
- **Temperature:**
  - If `temp > 15°C`, multiply by `(1 + (temp - 15) * 0.006)`.
  - If `temp < 5°C`, multiply by `(1 + (5 - temp) * 0.002)`.
- **Wind:**
  - If `wind > 0` (Headwind), multiply by `(1 + (wind / 10) * 0.03)`.
  - If `wind < 0` (Tailwind), multiply by `(1 - (abs(wind) / 10) * 0.012)`.
- **Surface:** Multiply by coefficient: {Asphalt: 1.0, Track: 0.98, Cobble: 1.05, Trail: 1.15}.

**2. UI Implementation:**
- Create a collapsible "Environment Lab" section using Tailwind CSS.
- Use `Range Sliders` for Temperature (-10 to 45°C) and Elevation (0 to 2000m).
- Add a `Toggle Group` for Surface types with icons (🛣, 🏟, 🧱, 🌲).
- **Live Feedback:** When any parameter changes, display a small badge next to the main pace: "Est. Effort: +15s/km".

**3. Visual Style:**
- Match the Apple Watch dark theme.
- Use subtle glows (Cyan for cold/easy, Amber for heat/slope).
- Ensure all labels are i18n compatible (en, zh, es, fr).

**4. SEO Text Generation:**
- Dynamically generate a summary sentence: "Based on {temp}°C and {surface}, your perceived effort will be equivalent to {calcPace}/km on a flat road."