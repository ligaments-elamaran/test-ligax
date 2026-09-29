# Implementation Plan: Recipe Blog Web Application

**Stack**: Next.js 15 (App Router, React 19, TypeScript) + Tailwind CSS + Lucide Icons + SQLite (`better-sqlite3`) + Zod
**Estimated files**: 24 files

---

## Data Model

The schema uses SQLite with WAL mode and foreign key constraints enabled. All IDs are generated using `crypto.randomUUID()`, and timestamps are ISO-8601 strings.

```sql
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time_minutes INTEGER NOT NULL DEFAULT 0,
  cook_time_minutes INTEGER NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  amount TEXT,
  unit TEXT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS instructions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_instructions_recipe_id ON instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);
```

---

## API Routes Table

| Method | Path | Request Body | Response | Description |
|--------|------|-------------|----------|-------------|
| GET | `/api/recipes` | Query: `?q=&tag=` | `{ data: RecipeSummary[] }` | List recipes sorted newest first, with optional search query (matches title, description, ingredient name) & tag filter |
| POST | `/api/recipes` | `CreateRecipeInput` (JSON) | `{ data: RecipeDetail }` (201) | Create recipe with ingredients, instructions, and tags in a single transaction |
| GET | `/api/recipes/:id` | — | `{ data: RecipeDetail }` | Get full recipe details including ingredients, instructions, and tags |
| PUT | `/api/recipes/:id` | `UpdateRecipeInput` (JSON) | `{ data: RecipeDetail }` | Update recipe metadata, ingredients, instructions, and tags |
| DELETE | `/api/recipes/:id` | — | `{ success: true }` (200) | Delete recipe and cascade delete linked ingredients, instructions, tag relations |
| GET | `/api/tags` | — | `{ data: Tag[] }` | Get all available tags with recipe count |
| POST | `/api/upload` | `multipart/form-data` (`file`) | `{ url: string, filename: string }` (201) | Upload recipe image (JPEG, PNG, WEBP max 5MB), stores in `uploads/` |
| GET | `/api/uploads/:filename` | — | Image Binary | Serve uploaded recipe photos from local disk with appropriate MIME headers |

---

## Component Tree

```
RootLayout (src/app/layout.tsx)
├── Navbar (src/components/navbar.tsx)
├── HomePage (src/app/page.tsx)
│   ├── SearchAndTagFilter (src/components/search-and-tag-filter.tsx)
│   └── RecipeGrid (src/components/recipe-grid.tsx)
│       └── RecipeCard (src/components/recipe-card.tsx)
├── RecipeDetailPage (src/app/recipes/[id]/page.tsx)
│   ├── RecipeHero (src/components/recipe-hero.tsx)
│   ├── RecipeMetrics (prep time, cook time, servings)
│   ├── IngredientChecklist (src/components/ingredient-checklist.tsx)
│   ├── StepByStepList (src/components/step-by-step-list.tsx)
│   └── RecipeDeleteButton (client confirmation modal)
├── NewRecipePage (src/app/recipes/new/page.tsx)
│   └── RecipeForm (src/components/recipe-form.tsx)
│       ├── ImageUploadInput (file drag/drop + camera support + external URL preview)
│       ├── DynamicIngredientList (add/remove rows, reorder)
│       ├── DynamicStepList (add/remove step rows)
│       └── TagSelector (tag pills, create-on-the-fly)
└── EditRecipePage (src/app/recipes/[id]/edit/page.tsx)
    └── RecipeForm (src/components/recipe-form.tsx, pre-populated)
```

---

## Phases & Tasks

### Phase 1: Project Setup, Config & Database Layer
- [ ] Task 1.1: Initialize Next.js project configuration and package dependencies (`next`, `react`, `react-dom`, `better-sqlite3`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`, devDependencies)
  - Files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts` (CREATE)
- [ ] Task 1.2: Base styling and UI utility functions
  - Files: `src/app/globals.css`, `src/lib/utils.ts` (CREATE)
- [ ] Task 1.3: SQLite database connection, initialization, schema migration, and seed dataset with rich example recipes
  - Files: `src/lib/db.ts`, `src/lib/schema.sql`, `src/lib/seed.ts` (CREATE)
- [ ] Task 1.4: Type definitions and Zod validation schemas
  - File: `src/types/recipe.ts` (CREATE)

### Phase 2: Backend API Endpoints & File Storage
- [ ] Task 2.1: Image upload and file-serving endpoints supporting camera captures, mobile file pickers, and disk storage in `uploads/`
  - Files: `src/app/api/upload/route.ts`, `src/app/api/uploads/[filename]/route.ts` (CREATE)
- [ ] Task 2.2: Recipe CRUD API handlers with ingredient matching, tag filtering, full text search, and atomic SQLite transactions
  - Files: `src/app/api/recipes/route.ts`, `src/app/api/recipes/[id]/route.ts` (CREATE)
- [ ] Task 2.3: Tags aggregation endpoint
  - File: `src/app/api/tags/route.ts` (CREATE)

### Phase 3: Core UI & Navigation
- [ ] Task 3.1: Responsive app layout and navigation bar with mobile-friendly action buttons
  - Files: `src/app/layout.tsx`, `src/components/navbar.tsx` (CREATE)
- [ ] Task 3.2: Homepage components — Live search bar, tag filter carousel/chips, and responsive recipe card grid
  - Files: `src/app/page.tsx`, `src/components/search-and-tag-filter.tsx`, `src/components/recipe-grid.tsx`, `src/components/recipe-card.tsx` (CREATE)

### Phase 4: Recipe Detail & Interactive Features
- [ ] Task 4.1: Recipe detail view with hero image, badges (prep/cook/servings), interactive ingredient checklist with check-off states, and clear step-by-step instructions
  - Files: `src/app/recipes/[id]/page.tsx`, `src/components/recipe-hero.tsx`, `src/components/ingredient-checklist.tsx`, `src/components/step-by-step-list.tsx` (CREATE)

### Phase 5: Mobile-Friendly "Add Recipe" & "Edit Recipe" Flows
- [ ] Task 5.1: Mobile-optimized recipe authoring form featuring direct camera/file uploads, image preview, dynamic ingredient builder (amount/unit/name rows), dynamic instruction steps, and tag management
  - Files: `src/components/recipe-form.tsx`, `src/app/recipes/new/page.tsx`, `src/app/recipes/[id]/edit/page.tsx` (CREATE)

### Phase 6: Testing, Polish & Documentation
- [ ] Task 6.1: Automated test suite verifying recipe search, ingredient query matching, tag filtering, and CRUD operations
  - Files: `tests/recipes.test.ts`, `vitest.config.ts` (CREATE)
- [ ] Task 6.2: Complete documentation covering installation, local dev, sample recipes, mobile authoring instructions, and API endpoints
  - File: `README.md` (CREATE)
