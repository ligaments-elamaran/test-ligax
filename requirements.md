# Requirements: Recipe Blog for Cooking

## Overview
A responsive, modern web application for publishing, managing, and browsing cooking recipes. The platform provides a welcoming recipe blog with an intuitive discovery experience (newest recipes, keyword search over titles and ingredients, and tag filtering) alongside a mobile-first "Add Recipe" and "Edit Recipe" management form supporting image uploads/URL previews, dynamic ingredient lists, and structured step-by-step instructions.

## Features

### Recipe Discovery & Browsing
- **Homepage Recipe Feed**: Grid/list of newest published recipes sorted chronologically by default.
- **Search Engine**: Instant text search matching recipe titles, descriptions, ingredients, and tags.
- **Tag Filtering**: Filter recipes by categorical tags (e.g., "Dinner", "Vegetarian", "Quick", "Dessert") with active filter indicators and reset controls.
- **Recipe Detail View**: Dedicated view showing recipe photo, title, summary, prep/cook/total times, serving count, formatted ingredient list with quantities, sequential step-by-step instructions, and clickable tags.

### Recipe Authoring & Management (Mobile-Friendly)
- **Mobile-Optimized Add/Edit Form**: Responsive form designed for one-handed and on-the-go mobile entry without touching code or data files.
- **Photo Upload & Preview**: Direct photo upload (stored locally in `/uploads` with serve endpoint) or image URL input with real-time visual preview.
- **Dynamic Ingredients Builder**: Add, reorder, edit, and remove ingredient items (name, amount, unit) interactively.
- **Dynamic Steps Builder**: Add, reorder, edit, and remove step-by-step cooking instructions.
- **Tag Assignment**: Multi-tag selector with preset chips and free-form custom tag creation.
- **Edit & Delete**: Full capability to update existing recipes and safely delete recipes with confirmation.

### User Experience & Layout
- Clean culinary aesthetics with warm, accessible typography, high-contrast readability, and recipe card badges (prep/cook time, tag pills).
- Responsive navigation with rapid links between Homepage ("Browse Recipes") and Add Recipe ("+ New Recipe").
- Empty states with call-to-actions for zero search results and empty recipe collections.
- Toast notifications and inline validation for form submissions and error recovery.

## Tech Stack
- **Framework**: Next.js (App Router, React 19, TypeScript) or Node/Express + React client. Single-repository Next.js recommended for seamless full-stack SSR, API routes, and static asset serving.
- **Database**: SQLite with Prisma ORM / better-sqlite3 for zero-setup, reliable local persistence and fast querying.
- **Styling**: Tailwind CSS with Lucide Icons for responsive, mobile-first design and accessible UI components.
- **Auth**: None (single-author personal blog mode by default; open authoring with optional administrative passcode if configured).
- **Image Storage**: Local filesystem storage (`/uploads/recipes`) served via Next.js static route or API file stream, plus external image URL fallback.

## Credentials & API Integrations
- None — no external third-party paid services or external cloud credentials required. Local SQLite storage and local filesystem upload handling.
- Optional Environment Variables: `PORT` (default 3000), `DATABASE_URL` (e.g., `file:./dev.db`).

## Data Model (brief)
- **Recipe**:
  - `id`: string (UUID or autoincrement ID)
  - `title`: string (required)
  - `slug`: string (unique, URL-friendly)
  - `description`: string (optional short summary)
  - `imageUrl`: string (required/fallback placeholder)
  - `prepTime`: integer (minutes)
  - `cookTime`: integer (minutes)
  - `servings`: integer (optional, default 4)
  - `createdAt`: datetime (indexed for chronological sorting)
  - `updatedAt`: datetime
  - *Relations*: has many `Ingredient`, has many `InstructionStep`, has many `RecipeTag`
- **Ingredient**:
  - `id`: string
  - `recipeId`: string (FK -> Recipe)
  - `name`: string (required, e.g. "Olive Oil")
  - `amount`: string (e.g. "2")
  - `unit`: string (e.g. "tbsp")
  - `orderIndex`: integer
- **InstructionStep**:
  - `id`: string
  - `recipeId`: string (FK -> Recipe)
  - `stepNumber`: integer
  - `instruction`: string (text)
- **Tag**:
  - `id`: string
  - `name`: string (unique, lowercase indexed)
  - *Relations*: belongs to many `Recipe` via `RecipeTag`
- **RecipeTag**:
  - `recipeId`: string
  - `tagId`: string

## API Surface (brief)
- **Recipes CRUD**:
  - `GET /api/recipes`: List recipes with optional query params `?search=query&tag=tagname&sort=newest`
  - `GET /api/recipes/:idOrSlug`: Retrieve single full recipe with ingredients, steps, and tags
  - `POST /api/recipes`: Create new recipe (JSON payload with nested ingredients, steps, tags)
  - `PUT /api/recipes/:id`: Update existing recipe
  - `DELETE /api/recipes/:id`: Delete recipe
- **Image Upload**:
  - `POST /api/upload`: Multipart form data file upload, returns `{ url: "/uploads/recipes/filename.jpg" }`
- **Tags**:
  - `GET /api/tags`: List all distinct tags with recipe count

## UI/UX
- **Layout**: Clean header with site logo/title, search bar, and primary navigation ("Explore Recipes", "+ Add Recipe"). Sticky bottom bar or floating action button on mobile screens.
- **Key Pages / Views**:
  - `/` (Home): Hero banner, quick filter tag pills, search input, recipe grid of newest recipes with cards (photo, title, prep/cook time, key tags).
  - `/recipes/[slug]`: Recipe detail page with photo hero, recipe metadata badges, ingredients checklist, sequential step cards, and edit/delete actions.
  - `/recipes/new`: Mobile-first recipe creation wizard/form with live image preview, dynamic add-line for ingredients and instructions.
  - `/recipes/[slug]/edit`: Pre-populated recipe editing form.
- **Design System**: Tailwind CSS with warm culinary palette (warm stone/amber/emerald accents), clean typography, rounded cards, and Lucide React icons.

## Constraints
- **Security**: Strict input validation with schema checks (Zod), sanitize user text to prevent XSS, restrict uploaded file types to standard image formats (JPEG, PNG, WEBP) with a 5MB size limit.
- **Performance**: Sub-100ms API query response using indexed SQLite tables for search and tag filters. Fast initial render with responsive image loading.
- **Mobile Usability**: Touch targets at least 44x44px, autofocus-safe mobile form inputs, non-breaking dynamic lists.

## Assumptions
- The blog is primarily intended for personal use or a single home cook publishing recipes directly from their mobile browser or desktop.
- Authentication is not required out of the gate; anyone with access to the hosted URL can post/edit recipes (optional passcode can be enabled in settings if needed).
- Local filesystem image storage in `./uploads` is sufficient and avoids third-party S3/Cloudinary setup.

## Out of Scope
- Multi-user authentication, social login, and permission hierarchies.
- Social commenting and rating system (can be added in future iterations).
- Automated grocery list integration or nutrition facts calculation APIs.
