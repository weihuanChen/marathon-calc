**Role:** Running Coach & Frontend UI Developer.
**Task:** Integrate RPE (Effort) and Breathing Status into the Split Table.

**1. Data Mapping:**
Create a mapping object `effortMapping` that links `RacePhases` to:
- **RPE:** (2-3, 4-6, 7-8, 9-10).
- **Breathing:** ("Full sentences", "Short phrases", "Few words", "Gasping").
- **Visual Color:** (Green to Red gradient).

**2. Split Table UI Update:**
- For each row in the Split Table, add a subtle `RPE` badge.
- **Interaction:** Implement a `Tooltip` (for Desktop) or `Bottom Sheet` (for Mobile) that triggers when a row is tapped.
- **Tooltip Content:** Display a "Coach's Tip". Example: "KM 32: You should be at RPE 8. If you can't say more than two words, slow down slightly."

**3. Heart Rate Integration (Optional):**
- If user provides `Max HR`, calculate the target heart rate range for each phase using the Karvonen formula and display it in the details.

**4. SEO Metadata:**
- Add `aria-label` to each split row describing the effort.
- Example: `<tr aria-label="KM 30, RPE 7, Hard effort, short phrases only">`.
- Ensure the RPE descriptions are localized (en, zh, es, fr).