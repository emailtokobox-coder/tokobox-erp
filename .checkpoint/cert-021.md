# Iterasi 21 — Upload UI Components

## File Created (3)

| File | Lines | State |
|------|-------|-------|
| src/features/upload/components/UploadForm.tsx | 290 | built |
| src/features/upload/components/index.ts | 8 | built |
| app/upload/page.tsx | 33 | built |

## Build Verification
- `npx tsc --noEmit` — **PASSED** (0 TypeScript errors in src/features/upload/ & app/upload/)
- Pre-existing test errors in OrderCalculator.test.ts, OrderSummaryService.test.ts — out of scope

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### UploadForm (290 lines)
- "use client" component with React hooks for state management
- **FileInput sub-component:** Click-to-upload per file type (Order All, Income, Adjustment, HPP, Grosir)
- **FileTypeConfig array:** Maps each file key to label, description, and accept patterns
- **ResultDisplay sub-component:** Shows transaction status, summary cards, errors, and warnings
- **Handle submit:** Builds FormData → calls `importFilesAction` → displays `OrchestratorResult`
- **States:** `isUploading` (loading spinner), `result` (success/error display)
- Uses existing UI components: `Button`, `Card`, icons from `lucide-react`
- Success banner: green with row count; Error banner: destructive with error list
- Warning cards: yellow-bordered for idempotency skip messages

### app/upload/page.tsx (33 lines)
- Next.js App Router page at `/upload`
- Suspense boundary with `UploadFormSkeleton` fallback
- Max-width container with consistent spacing

### Barrel Export (index.ts)
- Exports `UploadForm` component

## Architecture
```
app/upload/page.tsx
  → UploadForm (client component)
    → importFilesAction (Server Action)
      → ImportOrchestrator.run()
        → ImportServices → DbTransaction → Supabase
```

## Next Action
Iter 22 — Upload History Page: create `app/upload/history/page.tsx` with import history table using `getImportHistoryAction`. Wire to UploadForm for refresh after import.

## Issues
- None
