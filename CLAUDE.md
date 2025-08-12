# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CalyBase is a Firebase-based member management web application written in JavaScript. It's deployed on both Firebase Hosting and Vercel, with a dual-platform hosting strategy for redundancy.

### Architecture

- **Frontend**: Vanilla JavaScript with Firebase SDK v8.10.1
- **Backend**: Firebase (Firestore, Auth, Storage) + Express.js functions
- **Hosting**: Firebase Hosting + Vercel (dual deployment)
- **Database**: Firestore NoSQL database
- **Authentication**: Firebase Authentication

### Key Directories

- `public/` - Main web application files (HTML, CSS, JS)
- `functions/` - Firebase Cloud Functions (TypeScript/Node.js)
- `scripts/` - Utility and maintenance scripts
- `src/` - Alternative source structure with auth services
- `dataconnect/` - Firebase Data Connect configuration

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Start production server  
npm start

# Build/optimize for production
npm run build
npm run optimize
```

### Firebase Commands
```bash
# Deploy Firebase functions only
cd functions && npm run deploy

# Build and serve functions locally
cd functions && npm run serve

# Start Firebase emulator suite
firebase emulators:start

# Deploy everything to Firebase
firebase deploy
```

### Deployment Commands
```bash
# Quick deployment (auto-commit message)
npm run deploy:quick

# Interactive deployment (custom commit message)
npm run deploy:message

# Verify deployment status
npm run deploy:verify

# Watch for changes and auto-deploy
npm run deploy:watch
```

### Testing & Maintenance
```bash
# Performance testing
npm run perf:test

# Clear cache
npm run cache:clear

# Lint functions code
cd functions && npm run lint
```

## Project Structure & Conventions

### HTML Pages Architecture
Each main page follows a consistent pattern:
- `public/index.html` - Dashboard/landing page
- `public/membres.html` - Member management interface  
- `public/events.html` - Event management
- `public/avatars.html` - Avatar/profile management
- `public/user-management.html` - Admin user management
- `public/system-settings.html` - System configuration

### JavaScript Module System
The application uses a modular JavaScript architecture:

**Core Modules:**
- `firebase-config.js` - Firebase configuration loader (MUST load first)
- `auth-guard.js` - Authentication protection
- `navigation.js` - Navigation component
- `logger.js` - Centralized logging
- `constants.js` - Application constants

**Utility Modules:**
- `device-utils.js` - Device detection and mobile optimization
- `session-manager.js` - Session timeout management
- `cache-manager.js` - Local storage and caching
- `error-handler.js` - Global error handling

**Feature Modules:**
- `membres.js` - Member management logic
- `events.js` - Event management logic
- `user-management.js` - Admin user management

### Firebase Integration Patterns

**Authentication Flow:**
1. `firebase-config.js` loads configuration asynchronously
2. `auth-guard.js` protects pages from unauthenticated access
3. `session-manager.js` handles timeout and idle detection

**Data Access:**
- All Firestore operations go through centralized error handling
- Real-time updates using Firestore listeners
- Offline support with local caching

### Mobile & iPad Optimization
The application includes specific iPad and mobile optimizations:
- `ipad-enhancements.js` - iPad-specific UI enhancements
- `ipad-safari-fix.js` - Safari compatibility fixes
- `table-touch-enhancements.js` - Touch-friendly table interactions

## Deployment Strategy

### Dual Platform Deployment
The application deploys to both Firebase and Vercel:
- **Firebase**: Primary hosting with backend integration
- **Vercel**: Static hosting for redundancy and performance

### Deployment Verification
Every page includes deployment timestamp verification:
```javascript
// Required on every HTML page
<script src="deployment-timestamp.js"></script>
```

### Git Workflow
- Push to `main` branch triggers automatic deployments
- Use npm deployment scripts for consistent commit messages
- Emergency deployment available via `npm run deploy:quick`

## Important Constraints

### Security Requirements
- Never commit Firebase API keys or sensitive config to repository
- Firebase config loaded dynamically from secure endpoints
- All admin operations require proper role verification

### Browser Compatibility  
- Primarily optimized for Safari (iPad/iPhone focus)
- Uses Firebase SDK v8.10.1 (not v9+) for better compatibility
- Vanilla JavaScript only - no frameworks or build tools required

### File Dependencies
- `firebase-config.js` MUST load before any Firebase operations
- `deployment-timestamp.js` MUST be included on every page
- Authentication guard MUST protect all non-public pages

## Common Patterns

### Adding New Pages
1. Create HTML file in `public/` directory
2. Include required scripts in correct order:
   ```html
   <script src="deployment-timestamp.js"></script>
   <script src="firebase-config.js"></script>
   <!-- Firebase SDK scripts -->
   <script src="auth-guard.js"></script>
   ```
3. Add navigation link in `navigation.js`
4. Test deployment verification works

### Firebase Operations
```javascript
// Always wait for Firebase config
const config = await window.firebaseConfigPromise;

// Use global auth and db references
const user = window.auth.currentUser;
const doc = await window.db.collection('membres').doc(id).get();
```

### Error Handling
```javascript
// Use centralized error handler
try {
    // Firebase operation
} catch (error) {
    window.handleError(error, 'Operation description');
}
```

Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. Every page must include a deployment code that matches the latest deployment version before any other action is executed.