# Changelog

All notable changes to TaskSync will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Push notifications for due tasks
- Task categories and tags
- Recurring tasks
- Dark/Light theme toggle
- Multiple language support

---

## [1.0.2] - 2025-11-01

### Added
- Comprehensive documentation suite
  - API documentation with detailed endpoint specifications
  - Architecture documentation explaining system design
  - Deployment guide for production setup
  - Contributing guidelines for open-source collaboration
- MIT License file
- This CHANGELOG file

### Changed
- Updated README with comprehensive project information
- Enhanced app.json with production configuration
- Improved error handling in backend API

### Fixed
- MongoDB connection SSL/TLS configuration improvements
- Password hashing compatibility warnings

---

## [1.0.1] - 2025-10-30

### Added
- Task statistics endpoint (`GET /api/tasks/stats/summary`)
- Pull-to-refresh functionality in home screen
- Offline task persistence with AsyncStorage
- Search functionality for tasks
- Filter bar with task counts
- Task detail screen with edit capability

### Changed
- Improved UI/UX with better color scheme
- Enhanced form validation messages
- Optimized task list rendering performance

### Fixed
- Token expiration handling in frontend
- Task update timestamp not updating
- Due date picker timezone issues
- Empty state display when no tasks exist

---

## [1.0.0] - 2025-10-25

### Added

#### Backend Features
- FastAPI REST API with async support
- User authentication system
  - Registration endpoint
  - Login endpoint
  - JWT token generation (30-minute expiry)
  - Password hashing with bcrypt (12 rounds)
- Task management endpoints
  - Create task
  - Get all tasks (with filtering and sorting)
  - Get single task
  - Update task
  - Delete task
- MongoDB integration with Motor (async driver)
- Pydantic models for data validation
- CORS middleware for cross-origin support
- Health check endpoint
- Comprehensive error handling

#### Frontend Features
- Cross-platform mobile app (iOS, Android, Web)
- Built with React Native and Expo
- TypeScript for type safety
- Expo Router for file-based navigation
- Zustand state management
  - Authentication store
  - Task store with offline support
- User interface screens
  - Welcome/splash screen
  - Login screen
  - Registration screen
  - Home/dashboard screen
  - Task creation screen
  - Task detail/edit screen
  - Settings screen
- UI Components
  - TaskCard component with completion toggle
  - FilterBar for status filtering
  - FloatingActionButton for quick actions
- Features
  - Offline data persistence
  - Real-time task synchronization
  - Task search and filtering
  - Due date scheduling with calendar
  - Visual indicators for overdue tasks
  - Task completion tracking
  - Form validation with helpful errors
  - Loading states and error handling

#### Database
- MongoDB Atlas cloud database
- Collections: users, tasks
- Indexes for optimized queries

#### Infrastructure
- Backend deployed on Railway
- MongoDB hosted on Atlas
- Environment-based configuration
- Production-ready deployment setup

### Security
- JWT-based authentication
- Bcrypt password hashing
- HTTPS/TLS encryption
- Input validation with Pydantic
- User data isolation
- Protected API routes

---

## Version History Summary

- **1.0.2** (Current) - Documentation and polish
- **1.0.1** - Feature enhancements and bug fixes
- **1.0.0** - Initial release with core functionality

---

## Links

- [GitHub Repository](https://github.com/saurabh-eg/Tasksync)
- [API Documentation](docs/API.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

---

## Notes

### Breaking Changes
None in current versions.

### Deprecations
None in current versions.

### Known Issues
- MongoDB SSL connection may require specific configuration (see DEPLOYMENT.md)
- Dark mode is currently always enabled (light mode coming in 1.1.0)

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
