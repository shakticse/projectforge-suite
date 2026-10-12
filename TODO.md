# UI/UX Modernization TODO

## Plan (approved)
1. `src/index.css` + `src/components/layout/*` (Header/Search + AppLayout container)
   - Global neutral enterprise surfaces + stronger contrast
   - Mobile search implemented as a right-side slide-over `Sheet`
   - Improve layout spacing/typography consistency in the app shell

2. `src/components/layout/AppSidebar.tsx`
   - Refactor to better active state styling and grouping
   - Ensure contrast/surfaces match new theme

3. Key pages: start with `src/pages/Inventory.tsx`
   - Replace/adjust `glass-card` usage and spacing to match new shell

## Steps tracking
- [x] Step 1.1: Update global theme surfaces/contrast in `src/index.css`
- [x] Step 1.2: Refactor `src/components/layout/AppLayout.tsx` to use a consistent page container
- [x] Step 1.3: Refactor `src/components/layout/Header.tsx` to use right-side `Sheet` search on mobile
- [x] Step 2.1: Refactor `src/components/layout/AppSidebar.tsx` for grouping + consistent active styling
- [x] Step 3.1: Update `src/pages/Inventory.tsx` to align with new neutral surfaces/spacing
- [ ] Step 3.2: Inventory accessibility + UX fixes (remove dead Filter UI, replace confirm())

- [ ] Step 4: Run `npm run build` and manual smoke test routes


