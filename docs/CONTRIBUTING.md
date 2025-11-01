# Contributing to TaskSync

Thank you for your interest in contributing to TaskSync! This document provides guidelines and instructions for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to creating a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- Git installed on your machine
- Node.js (v18 or higher)
- Python (3.10 or higher)
- MongoDB (local or Atlas account)
- Code editor (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
   - Click the "Fork" button at the top right of the repository page

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Tasksync.git
   cd Tasksync
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/saurabh-eg/Tasksync.git
   ```

4. **Verify remotes**
   ```bash
   git remote -v
   # origin    https://github.com/YOUR_USERNAME/Tasksync.git (fetch)
   # origin    https://github.com/YOUR_USERNAME/Tasksync.git (push)
   # upstream  https://github.com/saurabh-eg/Tasksync.git (fetch)
   # upstream  https://github.com/saurabh-eg/Tasksync.git (push)
   ```

---

## Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.local .env

# Edit .env with your configuration
# Then start server
uvicorn server:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# In another terminal, run on Android
npm run android

# Or run on iOS
npm run ios
```

---

## How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
- Check if the bug has already been reported in [Issues](https://github.com/saurabh-eg/Tasksync/issues)
- Try to reproduce the bug with the latest version
- Gather relevant information (OS, versions, screenshots, logs)

**When submitting a bug report, include:**
- Clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, app version)
- Error messages or logs

**Bug Report Template:**
```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., Windows 11, macOS 13]
- App Version: [e.g., 1.0.2]
- Device: [e.g., iPhone 13, Samsung Galaxy S21]

## Additional Context
Any other context about the problem.
```

### Suggesting Features

**Before suggesting a feature:**
- Check if it's already been suggested in [Issues](https://github.com/saurabh-eg/Tasksync/issues)
- Consider if it aligns with the project's goals
- Think about implementation complexity

**When suggesting a feature, include:**
- Clear and descriptive title
- Detailed description of the feature
- Use cases and benefits
- Potential implementation approach
- Mockups or diagrams (if applicable)

**Feature Request Template:**
```markdown
## Feature Description
A clear description of the feature.

## Problem It Solves
Describe the problem this feature would solve.

## Proposed Solution
How you think this should be implemented.

## Alternatives Considered
Other solutions you've considered.

## Additional Context
Mockups, diagrams, or examples.
```

### Working on Issues

1. **Find an issue** to work on
   - Look for `good first issue` or `help wanted` labels
   - Comment on the issue to claim it

2. **Create a branch**
   ```bash
   git checkout -b feature/issue-number-short-description
   # Examples:
   # feature/123-add-dark-mode
   # bugfix/456-fix-login-crash
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   - Test manually
   - Run automated tests
   - Check on multiple devices/browsers

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add dark mode toggle (#123)"
   git push origin feature/123-add-dark-mode
   ```

6. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill in the PR template
   - Link to the issue

---

## Coding Standards

### General Principles

- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **KISS (Keep It Simple, Stupid)**: Simple solutions are better
- **YAGNI (You Aren't Gonna Need It)**: Don't add unnecessary features
- **Single Responsibility**: Each function/component should do one thing well

### TypeScript/JavaScript (Frontend)

**File Organization:**
```typescript
// 1. Imports
import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

// 2. Types/Interfaces
interface Props {
  title: string;
  onPress: () => void;
}

// 3. Constants
const MAX_TITLE_LENGTH = 100;

// 4. Component
export default function MyComponent({ title, onPress }: Props) {
  // Logic here
}

// 5. Styles
const styles = StyleSheet.create({
  // Styles here
});
```

**Naming Conventions:**
```typescript
// Components: PascalCase
MyComponent.tsx
TaskCard.tsx

// Files: camelCase
authStore.ts
config.ts

// Constants: UPPER_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Functions: camelCase
function handleSubmit() {}
const fetchTasks = async () => {}

// Interfaces: PascalCase
interface User {}
interface TaskState {}
```

**Code Style:**
```typescript
// ✅ Good
const isValid = email.includes('@');
if (isValid) {
  handleSubmit();
}

// ❌ Bad
const x = email.includes('@');
if (x) handleSubmit();

// ✅ Good - Destructuring
const { user, isLoading } = useAuthStore();

// ❌ Bad
const user = useAuthStore().user;
const isLoading = useAuthStore().isLoading;

// ✅ Good - Arrow functions for components
const TaskCard: React.FC<Props> = ({ task }) => {
  return <View>...</View>;
};

// ✅ Good - Async/await
const fetchData = async () => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};
```

### Python (Backend)

**File Organization:**
```python
# 1. Imports (standard library)
import os
import logging
from datetime import datetime

# 2. Imports (third-party)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 3. Imports (local)
from .utils import helper_function

# 4. Constants
MAX_TASKS_PER_USER = 1000
DEFAULT_PAGE_SIZE = 50

# 5. Models
class User(BaseModel):
    email: str
    name: str

# 6. Functions
def create_task(task_data: dict):
    pass

# 7. Routes
@router.post("/tasks")
async def create_task_endpoint():
    pass
```

**Naming Conventions:**
```python
# Functions: snake_case
def get_user_by_id():
    pass

# Classes: PascalCase
class TaskManager:
    pass

class UserCreate(BaseModel):
    pass

# Constants: UPPER_CASE
MAX_RETRIES = 3
JWT_ALGORITHM = "HS256"

# Variables: snake_case
user_email = "test@example.com"
is_valid = True
```

**Code Style:**
```python
# ✅ Good - Type hints
def create_user(email: str, password: str) -> User:
    pass

async def fetch_tasks(user_id: str) -> List[Task]:
    pass

# ✅ Good - Docstrings
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password
        hashed_password: The bcrypt hashed password
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

# ✅ Good - Error handling
try:
    result = await db.users.insert_one(user_doc)
    return result
except Exception as e:
    logger.error(f"Failed to create user: {e}")
    raise HTTPException(status_code=500, detail="User creation failed")
```

### Component Structure (React Native)

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Props interface
interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onDelete: () => void;
}

// Component
export default function TaskCard({ task, onPress, onDelete }: TaskCardProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [task]);
  
  // Event handlers
  const handlePress = () => {
    setIsExpanded(!isExpanded);
    onPress();
  };
  
  // Render helpers
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{task.title}</Text>
    </View>
  );
  
  // Main render
  return (
    <TouchableOpacity onPress={handlePress}>
      {renderHeader()}
      {isExpanded && (
        <View style={styles.content}>
          <Text>{task.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
});
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(tasks): add due date filtering"

# Bug fix
git commit -m "fix(auth): resolve token expiration issue"

# Documentation
git commit -m "docs(api): update endpoint documentation"

# Refactor
git commit -m "refactor(store): simplify task filtering logic"

# With body
git commit -m "feat(tasks): add task sharing

Allow users to share tasks with other users via email.
Includes permission management and notification system.

Closes #123"
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Tested on multiple devices/browsers

### PR Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests you ran

## Screenshots
If applicable

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass
```

### Review Process

1. **Automated Checks**
   - Linting
   - Type checking
   - Tests
   - Build verification

2. **Code Review**
   - At least one maintainer approval required
   - Address all feedback
   - Update PR based on comments

3. **Merge**
   - Squash and merge (default)
   - Delete branch after merge

---

## Testing Guidelines

### Frontend Testing

```typescript
// Example test
import { render, fireEvent } from '@testing-library/react-native';
import TaskCard from '../TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    completed: false,
  };

  it('renders task title', () => {
    const { getByText } = render(<TaskCard task={mockTask} />);
    expect(getByText('Test Task')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test Task'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Backend Testing

```python
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_task():
    # Login first
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "test123"}
    )
    token = login_response.json()["access_token"]
    
    # Create task
    response = client.post(
        "/api/tasks",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Test Task", "description": "Test"}
    )
    
    assert response.status_code == 200
    assert response.json()["title"] == "Test Task"
```

---

## Documentation

### Code Comments

```typescript
// ✅ Good - Explain why, not what
// Use debounce to prevent excessive API calls during typing
const debouncedSearch = debounce(search, 300);

// ❌ Bad - Obvious comment
// Set loading to true
setLoading(true);
```

### API Documentation

- Update `docs/API.md` for new endpoints
- Include request/response examples
- Document error cases

### README Updates

- Update features list
- Add new dependencies
- Update screenshots if UI changed

---

## Community

### Getting Help

- GitHub Discussions
- GitHub Issues (for bugs)
- Pull Request comments

### Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Social media shoutouts

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TaskSync! 🎉
