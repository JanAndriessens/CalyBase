# Mobile & Web App Separation Strategy for CalyBase

## Overview
This document outlines the best practices for developing the CalyBase mobile app while keeping the production web application completely isolated and stable. The web app will continue serving CalypsoDC members without interruption while mobile development proceeds in parallel.

## Repository & Code Management Strategy

### Option 1: Separate Repository (Recommended)
**Create new repository: `CalyBase-Mobile`**
- **Advantages**: Complete isolation, independent deployment, different tech stacks
- **Structure**:
  ```
  CalyBase-Mobile/
  ├── src/
  ├── components/
  ├── services/
  ├── config/
  └── shared/ (shared utilities with web)
  ```
- **Firebase**: Share same Firebase project but isolate mobile-specific code
- **Dependencies**: Independent package.json with React Native dependencies

### Option 2: Monorepo with Separation
**Keep in same repository but separate folders**
- **Structure**:
  ```
  CalyBase/
  ├── web/ (existing public/ files)
  ├── mobile/ (new React Native app)
  ├── shared/ (common utilities, types)
  └── firebase/ (functions, rules)
  ```
- **Advantages**: Easier code sharing, single repository management
- **Challenges**: More complex build/deploy processes

## Development Environment Isolation

### Firebase Project Strategy
**Option A: Shared Firebase Project (Recommended for Cost)**
- Use same Firebase project (calybase)
- Mobile app shares Firestore collections
- Separate mobile-specific security rules
- Benefits: Data consistency, lower costs

**Option B: Separate Development Project**
- Create `calybase-mobile-dev` for development
- Data migration tools between projects
- Higher costs but complete isolation

### Branch Strategy
```
main (production web app - DO NOT TOUCH)
├── web-hotfix/* (emergency web fixes only)
├── mobile-dev (main mobile development)
├── mobile-feature/* (feature branches)
└── integration/* (web + mobile integration testing)
```

## Data & API Sharing Strategy

### Firestore Collections Strategy
**Shared Collections** (existing data):
- `membres` - Share member data between web and mobile
- `events` - Share event data
- `users` - Share authentication data

**Mobile-Specific Collections**:
- `mobileUserPreferences` - Mobile app settings
- `pushNotifications` - Mobile notification tokens
- `mobileAnalytics` - Mobile-specific usage data

### API Strategy
**Shared Firebase Functions**:
- Keep existing web functions untouched
- Create new mobile-specific functions in subfolder:
  ```
  functions/
  ├── web/ (existing functions)
  ├── mobile/ (new mobile functions)
  └── shared/ (common utilities)
  ```

## Security & Configuration

### Environment Configuration
**Mobile App Config** (separate from web):
```javascript
// mobile/config/firebase.config.js
const mobileConfig = {
  apiKey: "same-as-web", // shared Firebase project
  authDomain: "calybase.firebaseapp.com",
  projectId: "calybase",
  appId: "NEW-MOBILE-APP-ID" // separate mobile app registration
}
```

**Security Rules Enhancement**:
```javascript
// Add mobile client detection
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing web rules (unchanged)
    match /membres/{memberId} {
      allow read, write: if request.auth != null 
        && (isWebClient() || isMobileClient());
    }
  }
}

function isMobileClient() {
  return request.headers.platform == 'mobile';
}
```

## Deployment Strategy

### Web App Deployment (Keep Existing)
- **Production**: Continue current Vercel/Firebase deployment
- **No Changes**: Web app deployment remains completely unchanged
- **Emergency Fixes**: Direct to main branch for critical issues

### Mobile App Deployment
- **Development**: TestFlight (iOS) + Internal Testing (Android)
- **Staging**: Firebase App Distribution for beta testing
- **Production**: App Store + Google Play Store

### Shared Infrastructure
```yaml
# CI/CD Pipeline Structure
.github/workflows/
├── web-deploy.yml (existing - unchanged)
├── mobile-build.yml (new)
├── mobile-test.yml (new)
└── integration-test.yml (web + mobile testing)
```

## Data Migration & Synchronization

### Member Data Strategy
**Immediate**: Mobile app reads existing web data
```javascript
// Mobile app uses existing Firestore collections
const membersCollection = firestore().collection('membres');
// No data migration needed - shares same data
```

**Future**: Add mobile-specific fields
```javascript
// Add mobile fields to existing documents
membre: {
  // ...existing web fields (unchanged)
  mobilePreferences: { // new mobile-only fields
    pushNotifications: true,
    biometricAuth: false
  }
}
```

## Testing Strategy

### Isolated Testing
- **Web App**: Continue existing testing (unchanged)
- **Mobile App**: Separate test suites with shared data
- **Integration**: Test mobile + web data consistency

### User Acceptance Testing
- **Production Web**: Members continue using web app
- **Beta Mobile**: Small group tests mobile with same data
- **Feedback Loop**: Mobile improvements don't affect web stability

## Timeline & Risk Management

### Phase 1: Foundation (Week 1-2)
- Set up separate mobile repository
- Configure Firebase for mobile access
- Establish development environment

### Phase 2: Core Development (Week 3-10)
- Build mobile app with shared Firestore data
- Web app continues normal operation
- Regular integration testing

### Phase 3: Beta Testing (Week 11-12)
- Internal testing with real club data
- Web app users unaffected
- Gradual mobile rollout

## Risk Mitigation

### Production Web App Protection
- **Firestore Rules**: Ensure mobile can't break web functionality
- **Branch Protection**: Main branch only for web emergency fixes
- **Monitoring**: Separate monitoring for web vs mobile Firebase usage

### Data Consistency
- **Shared Schema**: Document data contracts between web/mobile
- **Migration Scripts**: Plan for any future schema changes
- **Backup Strategy**: Regular backups before major mobile releases

### Communication Strategy
- **User Communication**: Inform members about upcoming mobile app
- **Beta Program**: Select enthusiastic members for early testing
- **Feature Parity**: Ensure mobile doesn't disrupt established web workflows

## Development Team Workflow

### Daily Development
1. **Web App**: Continue normal maintenance and feature development
2. **Mobile App**: Develop in isolation with shared data access
3. **Integration**: Regular testing to ensure data compatibility
4. **Deployment**: Separate deployment pipelines prevent conflicts

### Code Review Process
- **Web Changes**: Current review process (unchanged)
- **Mobile Changes**: New mobile-specific review process
- **Shared Changes**: Cross-team review for Firebase functions/rules

### Emergency Procedures
- **Web Issues**: Direct hotfix to main branch (existing process)
- **Mobile Issues**: Isolated to mobile repository/branches
- **Data Issues**: Coordinated response across both platforms

## Success Metrics

### Web App Stability (Maintain)
- Zero production downtime due to mobile development
- Existing user satisfaction maintained
- No performance degradation

### Mobile Development Progress
- Milestone delivery on schedule
- Beta user satisfaction scores
- Feature parity with web app

### Data Integrity
- Zero data loss or corruption
- Consistent data between platforms
- Successful backup and recovery testing

This separation strategy ensures CalyBase's production web application remains stable and reliable while enabling full-featured mobile development with shared data infrastructure and optimal user experience across both platforms.