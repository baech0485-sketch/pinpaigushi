# Learnings

- Next.js App Router `page.tsx` serves as the main controller for the page logic.
- Integrating components requires careful attention to their export types (default vs named).
- State management in a single page flow involves tracking steps (`idle`, `text`, `images`, `done`) to coordinate UI updates.
- Mocking or handling API calls requires matching the expected request/response formats.

# Implementation Details

- Modified `app/page.tsx` to implement the brand story generation flow.
- Integrated `InputForm`, `CopySection`, and `ImageSection`.
- Added state for `isLoading`, `step`, `brandCopy`, `images`, `error`.
- Implemented `handleGenerate` to chain API calls:
    1. `/api/generate-text` -> returns `BrandCopy`
    2. `/api/generate-images` -> returns `ImageData[]`
- Added UI for loading states and error handling.
- Styled with Tailwind CSS using the Meituan Yellow theme.
