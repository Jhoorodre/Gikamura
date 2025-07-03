# Gikamoe - React Reader Platform

A modern React application for reading manga/webtoons with RemoteStorage synchronization support.

## Architecture & Code Organization

This project follows clean architecture principles with anchor comments for AI-assisted development:

- **AIDEV-NOTE**: Core functionality and performance notes
- **AIDEV-TODO**: Future improvements and missing features  
- **AIDEV-QUESTION**: Areas needing clarification or review

Use `grep -r "AIDEV-" src/` to find all anchor comments throughout the codebase.

## Technology Stack

- React 19 with modern hooks and context
- Vite for fast development and optimized builds
- React Query for state management and caching
- React Router for navigation
- RemoteStorage.js for decentralized data sync
- CSS modules with design tokens

## Key Features

- **Hub System**: Load content from external JSON hubs
- **Reading Experience**: Optimized manga/webtoon reader
- **RemoteStorage Sync**: Cross-device reading progress sync
- **Offline Support**: Service Worker with smart caching
- **Network Resilience**: Robust error handling and retries

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Built with Vite + React template with enhanced ESLint configuration for production use.
