# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

## Architecture Overview

### Core Technology Stack
- **React 19** with hooks and context for state management
- **Vite** for fast development and optimized builds
- **React Query** for server state management and caching
- **React Router** for client-side routing
- **RemoteStorage.js** for decentralized data synchronization

### Key Architecture Patterns

**Context-Based State Management**
- `AppContext` - Global app state, series data, and user preferences
- `HubContext` - Hub loading and management
- `RemoteStorageContext` - Sync status and connection management
- `UserPreferencesContext` - User settings and preferences

**Service Layer**
- `api.js` - Core CRUD operations for series, chapters, and hubs with RemoteStorage
- `jsonReader.js` - Hub JSON parsing and validation
- `networkService.js` - Network utilities and error handling
- `rs/` directory - RemoteStorage configuration and schemas

**Component Structure**
- `components/common/` - Reusable UI components
- `components/hub/` - Hub-specific components
- `components/item/` - Series/item display components
- `pages/` - Route-level page components
- `views/` - Complex view components with routing logic

**Hook-Based Logic**
- `useItem.js` - Item selection and data management
- `useHubLoader.js` - Hub loading logic
- `useReader.js` - Reading experience functionality
- `useNetworkMonitor.js` - Network status monitoring

### Data Flow & RemoteStorage Integration

**Series Management**
- Series are stored in RemoteStorage with schema validation
- Pinned vs unpinned series distinction for "Works" and "History" views
- Automatic deduplication and cleanup of corrupted entries
- Progress tracking per chapter with conflict resolution

**Hub System**
- External JSON hubs define content catalogs
- Hub URLs are normalized to prevent duplicates
- Cached hub data with automatic refresh mechanisms
- Support for both local and remote hub sources

### Key Implementation Details

**AIDEV Comments System**
The codebase uses structured comments for AI-assisted development:
- `AIDEV-NOTE:` - Implementation notes and explanations
- `AIDEV-TODO:` - Future improvements needed
- `AIDEV-QUESTION:` - Areas needing clarification

Use `grep -r "AIDEV-" src/` to find all anchor comments.

**Performance Optimizations**
- Lazy loading for route components to reduce initial bundle size
- Manual chunk splitting in Vite config for better caching
- Image optimization and lazy loading
- Debounced operations for user interactions
- Virtualization for large lists

**RemoteStorage Schema Requirements**
- Series must have: `slug`, `source`, `url`, `title`, `timestamp`
- Hubs must have: `url`, `title`, `timestamp`
- Always preserve required fields when updating entries
- Use `api.js` methods instead of direct RemoteStorage calls

### Critical Constants

**App Configuration** (`src/constants/app.js`)
- `DEFAULT_HUB_URL` - Empty by default to prevent auto-loading
- `MAX_HISTORY_ITEMS` - Limits unpinned series to 20 items
- `RS_PATH` - RemoteStorage namespace ("gikamoe")

**RemoteStorage Paths** (`src/services/rs/rs-config.js`)
- Base namespace: "Gika"
- All user data stored under this namespace

## Development Guidelines

### Code Style & Patterns
- Follow existing component patterns and imports
- Use the established context providers for state management
- Implement proper error boundaries and loading states
- Maintain schema compliance for RemoteStorage operations

### RemoteStorage Best Practices
- Always use `api.js` methods for data operations
- Preserve required schema fields when updating entries
- Handle 404 errors gracefully (series/hubs may not exist)
- Clear caches after data modifications
- Use deduplication functions to prevent duplicate entries

### Performance Considerations
- Lazy load route components with React.lazy()
- Use React.memo() for expensive components
- Implement proper dependency arrays in useEffect hooks
- Cache network requests where appropriate
- Use intersection observer for scroll-based features

### Testing & Validation
- No specific test framework configured - check for existing patterns
- Use browser dev tools for RemoteStorage debugging
- Validate JSON schema compliance for hub data
- Test network failure scenarios and offline functionality

## Common Development Tasks

### Adding New Routes
- Add lazy-loaded component in `App.jsx`
- Use Suspense with transparent fallback to prevent flickering
- Follow the established route structure pattern

### RemoteStorage Operations
- Use `api.js` methods: `pushSeries()`, `pinSeries()`, `addHub()`
- Call `clearCaches()` after data modifications
- Handle schema validation errors appropriately
- Use `resetSync()` on reconnection to ensure data consistency

### UI Component Development
- Follow the existing component structure in `components/`
- Use established CSS organization (ITCSS methodology)
- Implement proper loading and error states
- Ensure responsive design across breakpoints

### Hub Integration
- Validate hub JSON structure with `jsonValidator.js`
- Handle network failures gracefully
- Implement proper caching strategies
- Support both local and remote hub sources