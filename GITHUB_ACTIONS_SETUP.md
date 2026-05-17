# GitHub Actions CI/CD Setup Guide

## Overview

This guide explains how to set up and use GitHub Actions for continuous integration and deployment of the Interview Pro fullstack application.

## Prerequisites

- GitHub repository (public or private)
- GitHub Actions enabled (enabled by default for public repos, free tier available)
- Basic understanding of Git workflow

## Quick Start

### 1. Push Your Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/interview-pro.git

# Create and push to main branch
git checkout -b main
git add .
git commit -m "Initial commit: Interview Pro fullstack with CI/CD"
git push -u origin main
```

### 2. GitHub Actions Workflow is Already Configured

The CI/CD pipeline is automatically configured in `.github/workflows/ci-cd.yml`. It will run automatically on:
- Every push to `main`, `develop`, or `master` branches
- Every pull request to these branches

## Workflow Jobs

### 1. **Backend Tests & Coverage** 
   - **Trigger**: Runs on every push/PR
   - **Steps**:
     - Checkout code
     - Set up Python 3.12
     - Install dependencies from `requirements.txt`
     - Compile Python code for syntax errors
     - Run pytest with coverage reporting
     - Upload coverage to Codecov
   - **Coverage Threshold**: 45% (configured in `pytest.ini`)

### 2. **Frontend Tests, Build & E2E**
   - **Trigger**: Runs on every push/PR
   - **Steps**:
     - Checkout code
     - Set up Node.js 20
     - Install npm dependencies
     - Run unit tests with vitest
     - Build production bundle
     - Run Playwright E2E tests (non-blocking)

### 3. **Docker Validation**
   - **Trigger**: Depends on backend and frontend tests passing
   - **Steps**:
     - Validate docker-compose configuration
     - Build backend Docker image
     - Build frontend Docker image
   - **Uses**: Docker Buildx for efficient multi-platform builds

### 4. **Deploy (Production)**
   - **Trigger**: Only runs on `main`/`master` branches after successful tests
   - **Condition**: Manual deployment hook placeholder
   - **Steps**: Logs deployment readiness

### 5. **CI Status Summary**
   - **Trigger**: Always runs (even if jobs fail)
   - **Purpose**: Provides overall pipeline status
   - **Behavior**: Fails if critical tests fail

## Viewing Workflow Results

### 1. GitHub UI

**Navigate to Actions Tab:**
```
GitHub Repository → Actions tab → Select workflow run
```

**View Details:**
- Click on any job to expand and see detailed logs
- Check timestamps and duration for each step
- Download artifacts if available

**Workflow Statuses:**
- ✅ **Success**: All jobs passed
- ❌ **Failed**: At least one job failed  
- ⏸️ **Skipped**: Job skipped based on conditions
- ⌛ **In Progress**: Job currently running

### 2. Badges in README

Add a status badge to your README:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/interview-pro/actions/workflows/ci-cd.yml/badge.svg)
```

This shows real-time CI status on your repo main page.

## Configuration Details

### Backend Testing

**File**: `Fullstack/pytest.ini`

```ini
[pytest]
testpaths = tests
python_files = test_*.py
markers =
    unit: fast service/unit tests
    integration: API and database tests
    e2e: long end-to-end checks
addopts = --cov=src --cov-report=term-missing --cov-fail-under=45
```

**To run locally:**
```bash
cd Fullstack
python -m pytest
```

### Frontend Testing

**File**: `Frontend_for_Fullstack/my_app/package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:e2e": "playwright test",
    "build": "vite build"
  }
}
```

**To run locally:**
```bash
cd Frontend_for_Fullstack/my_app
npm run test
npm run test:e2e
npm run build
```

## Filtering and Pagination Features

The application now includes:

### Backend Enhancements (`.github/workflows/ci-cd.yml` validates these)

**New Endpoints:**
- `GET /api/v3/interviews` - Full filtering and pagination
- `GET /api/v3/my-interviews` - User-specific interviews

**Query Parameters:**
```
- page: Page number (default: 1)
- page_size: Items per page (default: 10, max: 100)
- position: Filter by job position
- company: Filter by company name
- interview_type: Filter by interview type
- is_template: Filter templates (true/false)
- owner_id: Filter by owner ID
- sort_by: Sort field (created_at, updated_at, job_position, company)
- sort_order: Sort order (asc, desc)
- search: Full-text search
```

### Frontend Enhancements

**ProfilePage:**
- Advanced filtering panel with search, position, company, type filters
- Sortable columns
- Adjustable page size (5, 10, 20, 50 per page)
- Previous/Next pagination controls
- Filter status indicator

**TemplatesPage:**
- Collapsible filter panel
- Grid-based template display with pagination
- Sort by created, updated, position, company
- Responsive design for mobile/tablet/desktop

## Common Issues & Troubleshooting

### Issue: Tests Fail on Push

**Solution:**
1. Check the failed job's logs in GitHub Actions
2. Fix issues locally and test: `pytest` or `npm run test`
3. Commit and push fixes
4. GitHub Actions will automatically re-run

### Issue: Python/Node Version Mismatch

**Backend:**
```bash
python --version  # Should be 3.12+
```

**Frontend:**
```bash
node --version  # Should be 20+
npm --version   # Should be 10+
```

### Issue: Coverage Below Threshold

**Current Threshold:** 45%

**Fix:**
```bash
cd Fullstack
python -m pytest --cov=src --cov-report=html
# Open htmlcov/index.html to see coverage report
```

### Issue: Docker Build Fails

```bash
# Validate configuration locally
docker compose --env-file .env.example config

# Build images locally
docker compose build
```

## Environment Variables

### GitHub Secrets (Optional for Private Repos)

If you need private environment variables:

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add variables like `DATABASE_URL`, `API_KEYS`, etc.
4. Reference in workflow: `${{ secrets.VARIABLE_NAME }}`

**Example:**
```yaml
- name: Deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
  run: your-deploy-command
```

## Performance Tips

### Speed Up Workflow

1. **Enable Caching:**
   - npm cache is already enabled
   - pip cache can be added

2. **Optimize Dependencies:**
   - Remove unused packages
   - Use `npm ci` instead of `npm install`

3. **Parallel Jobs:**
   - Backend and frontend tests run in parallel
   - Docker builds only after both pass

### Current Workflow Duration

- Backend tests: ~2-3 minutes
- Frontend tests: ~3-5 minutes  
- Docker builds: ~2-3 minutes
- **Total**: ~5-8 minutes (parallel execution)

## Advanced Configuration

### Run Tests Only on Specific Files Changed

```yaml
on:
  push:
    paths:
      - 'Fullstack/**'  # Only run backend on backend changes
```

### Add Deployment on Release

```yaml
- name: Deploy on Release
  if: github.event_name == 'release' && github.event.action == 'published'
  run: your-deploy-command
```

### Send Notifications (Slack, Email)

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

## Useful Commands for Local Testing

### Backend

```bash
# Install dependencies
cd Fullstack
pip install -r requirements.txt

# Run all tests
python -m pytest

# Run specific test
python -m pytest tests/test_backend_minimal.py -v

# Run with coverage
python -m pytest --cov=src --cov-report=html

# Run specific marker
python -m pytest -m unit
```

### Frontend

```bash
# Install dependencies  
cd Frontend_for_Fullstack/my_app
npm install

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Development server
npm run dev
```

### Docker

```bash
# Build all services
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Run tests in container
docker compose run backend python -m pytest
docker compose run frontend npm run test
```

## Monitoring & Reports

### Coverage Reports

After backend tests, coverage is uploaded to **Codecov** (free tier):

1. Visit [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Select your repository
4. View coverage trends over time

### Test Results

View detailed test results in GitHub Actions:

1. Repository → Actions tab
2. Click on workflow run
3. Expand job to see test details
4. Failed tests show specific error messages

## Next Steps

1. **Setup Codecov** (optional): Visit codecov.io and link your repo
2. **Add Status Badge**: Add the CI badge to your README
3. **Configure Notifications**: Add Slack/Discord/Email notifications
4. **Set Branch Protection**: Require CI to pass before merging PRs
5. **Monitor Performance**: Check workflow logs regularly

## Branch Protection Rules

To enforce CI passing before merges:

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Check "Require status checks to pass before merging"
4. Check "Require branches to be up to date before merging"
5. Select jobs that must pass:
   - ✅ Backend Tests & Coverage
   - ✅ Frontend Tests, Build & E2E

## File Structure

```
.github/
├── workflows/
│   └── ci-cd.yml (main workflow file)
Fullstack/
├── pytest.ini
├── requirements.txt
├── tests/
│   └── test_backend_minimal.py
└── src/
Frontend_for_Fullstack/my_app/
├── package.json
├── vitest.config.ts
├── playwright.config.ts
├── src/__tests__/
│   └── app-minimal.test.tsx
└── e2e/
    └── business.spec.ts
```

## Support & Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Pytest Documentation**: https://docs.pytest.org
- **Vitest Documentation**: https://vitest.dev
- **Docker Compose Docs**: https://docs.docker.com/compose

---

**Last Updated**: 2024

**Maintained By**: Interview Pro Team
