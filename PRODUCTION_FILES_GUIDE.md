# Created by Kiro - Production Files Guide
# Har file ka purpose aur use case

## 📋 Complete Production Files Reference Table

| File Name | Location | Purpose | Kya Hota Hai | Requirement |
|-----------|----------|---------|-------------|-------------|
| `.gitattributes` | Root | Git line ending configuration | Sab OS par same line endings ensure karta hai (LF) | ✅ Required |
| `.gitignore` | Root | Global files ko git se exclude karta hai | node_modules, .env, build files ko track nahi karta | ✅ Required |
| `.env.local` | Root | Local development environment variables | Local machine par sensitive data store karta hai (git ignore) | ✅ Required |
| `.env.example` | Root | Environment template for sharing | Developers ko batata hai kaun kaun variables chahiye | ✅ Required |
| `.env.production` | Root | Production environment variables | Production server par use hota hai | ✅ Required |
| `.env.development` | Root | Development environment variables | Local development par use hota hai | ✅ Required |
| `.npmrc` | Root | NPM package manager configuration | npm install behavior control karta hai (exact versions, timeouts) | ✅ Required |
| `.yarnrc.yml` | Root | Yarn package manager configuration | Yarn install behavior control karta hai | ⚠️ Optional (if using yarn) |
| `.editorconfig` | Root | Cross-editor code formatting rules | VS Code, Sublime, WebStorm sab par same indentation/formatting | ✅ Required |
| `.prettierrc` | Root | Code formatter configuration | Automatic code formatting rules (semicolons, quotes, line width) | ✅ Required |
| `.prettierignore` | Root | Prettier ko exclude karta hai | node_modules, build files ko format nahi karta | ✅ Required |
| `.eslintignore` | Root | ESLint ko exclude karta hai | node_modules, build files ko lint nahi karta | ✅ Required |
| `.babelrc` | Root | JavaScript transpilation configuration | Modern JS ko older browsers ke liye convert karta hai | ✅ Required |
| `.browserslistrc` | Root | Target browser versions specify karta hai | Polyfills aur transpilation ke liye browser support define karta hai | ✅ Required |
| `.nvmrc` | Root | Node Version Manager version file | `nvm use` command se correct Node version load hota hai | ✅ Required |
| `.node-version` | Root | Nodenv version file | `nodenv` tool se correct Node version load hota hai | ⚠️ Optional (if using nodenv) |
| `.tool-versions` | Root | ASDF version manager file | `asdf` tool se correct Node version load hota hai | ⚠️ Optional (if using asdf) |
| `Dockerfile` | Root | Docker container image definition | Production app ko container mein run karta hai | ✅ Required |
| `docker-compose.yml` | Root | Multi-container Docker setup | Local development mein multiple services (admin, api, redis) run karta hai | ✅ Required |
| `.dockerignore` | Root | Docker build se exclude karta hai | node_modules, .git, .env ko Docker image mein nahi copy karta | ✅ Required |
| `.easignore` | Root | EAS build service ignore file | Expo EAS build se unnecessary files exclude karta hai | ✅ Required (Expo) |
| `.commitlintrc` | Root | Commit message validation | Conventional commit format enforce karta hai (feat:, fix:, etc) | ✅ Required |
| `.github/workflows/ci.yml` | .github/workflows | Continuous Integration pipeline | Push/PR par automatically lint, test, build karta hai | ✅ Required |
| `.github/workflows/deploy.yml` | .github/workflows | Continuous Deployment pipeline | Main branch par automatically production mein deploy karta hai | ✅ Required |
| `.github/CODEOWNERS` | .github | Code ownership rules | Specific files ke liye automatic reviewers assign karta hai | ⚠️ Optional |
| `.github/dependabot.yml` | .github | Automated dependency updates | Weekly npm, docker, github-actions updates ke PRs create karta hai | ⚠️ Optional |
| `.github/pull_request_template.md` | .github | PR template | New PR create karte time standard format provide karta hai | ⚠️ Optional |
| `.github/issue_template/bug_report.md` | .github/issue_template | Bug report template | Bug report create karte time standard format provide karta hai | ⚠️ Optional |
| `.github/issue_template/feature_request.md` | .github/issue_template | Feature request template | Feature request create karte time standard format provide karta hai | ⚠️ Optional |
| `.vscode/settings.json` | .vscode | VS Code workspace settings | Prettier auto-format, ESLint auto-fix, tab size, etc configure karta hai | ✅ Required |
| `.vscode/extensions.json` | .vscode | Recommended VS Code extensions | Team members ko important extensions install karne ke liye suggest karta hai | ⚠️ Optional |
| `.vscode/launch.json` | .vscode | Debug configurations | F5 press karte time mobile app, admin, video editor debug hota hai | ⚠️ Optional |
| `.vscode/tasks.json` | .vscode | Development tasks | Ctrl+Shift+B se common tasks (lint, test, build) run hota hai | ⚠️ Optional |
| `.husky/.gitignore` | .husky | Husky directory ignore | Husky internal files ko git track nahi karta | ✅ Required |
| `.husky/pre-commit` | .husky | Pre-commit git hook | Commit karte time automatically prettier aur eslint run hota hai | ✅ Required |
| `.husky/commit-msg` | .husky | Commit message hook | Commit message conventional format mein hona chahiye validate karta hai | ✅ Required |
| `apps/gully-fame-mobile/.env` | Mobile | Mobile app production environment | API URL, Firebase keys, Razorpay keys store karta hai | ✅ Required |
| `apps/gully-fame-mobile/.env.example` | Mobile | Mobile app environment template | Developers ko batata hai kaun kaun variables chahiye | ✅ Required |
| `apps/gully-fame-mobile/.gitignore` | Mobile | Mobile app ignore rules | node_modules, .expo, android build files exclude karta hai | ✅ Required |
| `apps/gully-fame-mobile/.gitattributes` | Mobile | Mobile app git attributes | Line endings consistent rakhta hai | ✅ Required |
| `apps/gully-fame-mobile/android/.gitignore` | Mobile/Android | Android build ignore | .gradle, build/, *.apk, keystore files exclude karta hai | ✅ Required |
| `apps/gully-fame-admin/.env.local` | Admin | Admin app production environment | API URL, Firebase keys store karta hai | ✅ Required |
| `apps/gully-fame-admin/.env.example` | Admin | Admin app environment template | Developers ko batata hai kaun kaun variables chahiye | ✅ Required |
| `apps/gully-fame-admin/.gitignore` | Admin | Admin app ignore rules | node_modules, .next, build files exclude karta hai | ✅ Required |
| `apps/gully-fame-admin/.gitattributes` | Admin | Admin app git attributes | Line endings consistent rakhta hai | ✅ Required |
| `apps/videoeditor/.env` | Video Editor | Video editor production environment | API URL, AWS keys, FFmpeg config store karta hai | ✅ Required |
| `apps/videoeditor/.env.example` | Video Editor | Video editor environment template | Developers ko batata hai kaun kaun variables chahiye | ✅ Required |
| `apps/videoeditor/.gitignore` | Video Editor | Video editor ignore rules | node_modules, .expo, temp_videos, exported_videos exclude karta hai | ✅ Required |
| `apps/videoeditor/.gitattributes` | Video Editor | Video editor git attributes | Line endings consistent rakhta hai | ✅ Required |

---

## 🎯 File Categories Aur Unka Purpose

### **1. ENVIRONMENT FILES (.env*)**
```
Kya hota hai: Application ko different environments (dev, prod) mein run karta hai
Requirement: ✅ MUST HAVE
Files:
  - .env.local (local development)
  - .env.example (template - git mein commit karo)
  - .env.production (production server)
  - .env.development (development server)
  - .env (app-specific production)

Example:
  .env.example mein: EXPO_PUBLIC_API_BASE_URL=your_api_url_here
  .env mein: EXPO_PUBLIC_API_BASE_URL=http://103.194.228.68:3552/v1/api/
```

### **2. GIT FILES (.git*)**
```
Kya hota hai: Git version control ko configure karta hai
Requirement: ✅ MUST HAVE
Files:
  - .gitignore (kaun files track nahi karne)
  - .gitattributes (line endings consistent karne)

Example:
  .gitignore mein: node_modules/ (git track nahi karega)
  .gitattributes mein: *.ts text eol=lf (sab OS par LF use hoga)
```

### **3. CODE QUALITY FILES (.prettier*, .eslint*, .babel*)**
```
Kya hota hai: Code formatting aur linting enforce karta hai
Requirement: ✅ MUST HAVE
Files:
  - .prettierrc (code formatting rules)
  - .prettierignore (prettier exclude)
  - .eslintignore (eslint exclude)
  - .babelrc (JavaScript transpilation)
  - .editorconfig (cross-editor consistency)

Example:
  .prettierrc: printWidth: 100 (100 characters se zyada line nahi)
  .eslintignore: node_modules/ (linting nahi karega)
```

### **4. PACKAGE MANAGER FILES (.npmrc, .yarnrc.yml)**
```
Kya hota hai: npm/yarn install behavior control karta hai
Requirement: ✅ MUST HAVE
Files:
  - .npmrc (npm configuration)
  - .yarnrc.yml (yarn configuration)

Example:
  .npmrc: save-exact=true (exact versions save hote hain)
  .yarnrc.yml: nodeLinker: node-modules (node_modules folder use hota hai)
```

### **5. VERSION MANAGEMENT FILES (.nvmrc, .node-version, .tool-versions)**
```
Kya hota hai: Correct Node.js version automatically load karta hai
Requirement: ✅ MUST HAVE
Files:
  - .nvmrc (nvm ke liye)
  - .node-version (nodenv ke liye)
  - .tool-versions (asdf ke liye)

Example:
  Sab mein: 18.17.0 (same Node version sab developers use karenege)
```

### **6. DOCKER FILES (Dockerfile, docker-compose.yml, .dockerignore)**
```
Kya hota hai: Application ko container mein run karta hai
Requirement: ✅ MUST HAVE (production deployment)
Files:
  - Dockerfile (production image build)
  - docker-compose.yml (local development setup)
  - .dockerignore (docker build exclude)

Example:
  Dockerfile: Multi-stage build (small production image)
  docker-compose.yml: Admin, API, Redis services run karte hain
```

### **7. CI/CD FILES (.github/workflows/)**
```
Kya hota hai: Automatic testing, linting, deployment karta hai
Requirement: ✅ MUST HAVE (production)
Files:
  - .github/workflows/ci.yml (lint, test, build)
  - .github/workflows/deploy.yml (production deploy)

Example:
  ci.yml: Push par automatically npm run lint, npm test, npm run build
  deploy.yml: Main branch par automatically production mein deploy
```

### **8. GIT HOOKS FILES (.husky/)**
```
Kya hota hai: Commit karte time automatically checks run karta hai
Requirement: ✅ MUST HAVE
Files:
  - .husky/pre-commit (prettier aur eslint run karta hai)
  - .husky/commit-msg (commit message validate karta hai)

Example:
  pre-commit: Commit karte time code format aur lint check hota hai
  commit-msg: Commit message "feat: xyz" format mein hona chahiye
```

### **9. VS CODE FILES (.vscode/)**
```
Kya hota hai: VS Code editor ko configure karta hai
Requirement: ✅ MUST HAVE (development)
Files:
  - .vscode/settings.json (auto-format, tab size, etc)
  - .vscode/extensions.json (recommended extensions)
  - .vscode/launch.json (debug configurations)
  - .vscode/tasks.json (development tasks)

Example:
  settings.json: Prettier auto-format on save
  launch.json: F5 press karte time mobile app debug hota hai
```

### **10. BUILD CONFIGURATION FILES (.browserslistrc, .commitlintrc, .easignore)**
```
Kya hota hai: Build aur deployment process configure karta hai
Requirement: ✅ MUST HAVE
Files:
  - .browserslistrc (target browsers)
  - .commitlintrc (commit message format)
  - .easignore (EAS build exclude)

Example:
  .browserslistrc: last 2 versions (last 2 browser versions support)
  .commitlintrc: feat:, fix:, docs: format enforce karta hai
  .easignore: node_modules/ (EAS build mein nahi copy hoga)
```

---

## ✅ MINIMUM REQUIRED FILES (Production Ready)

```
MUST HAVE (18 files):
1. .gitattributes
2. .gitignore
3. .env.local
4. .env.example
5. .env.production
6. .npmrc
7. .editorconfig
8. .prettierrc
9. .prettierignore
10. .eslintignore
11. .babelrc
12. .browserslistrc
13. .nvmrc
14. Dockerfile
15. docker-compose.yml
16. .dockerignore
17. .commitlintrc
18. .husky/pre-commit
19. .husky/commit-msg
20. .vscode/settings.json
21. .github/workflows/ci.yml
22. .github/workflows/deploy.yml
23. apps/*/env files
24. apps/*/.gitignore
25. apps/*/.gitattributes
```

---

## 🚀 DEPLOYMENT CHECKLIST

```
Before Production Deployment:
✅ .env.production filled with correct values
✅ .env.example updated with all required variables
✅ Dockerfile tested locally
✅ docker-compose.yml working
✅ .github/workflows/ci.yml passing
✅ .github/workflows/deploy.yml configured
✅ .husky hooks working (pre-commit, commit-msg)
✅ .vscode/settings.json configured
✅ All .gitignore files updated
✅ .npmrc configured for production
```

---

## 📊 FILE STATISTICS

```
Total Files Created: 50+
Required Files: 25+
Optional Files: 25+

By Category:
- Environment Files: 6
- Git Files: 8
- Code Quality: 5
- Package Manager: 2
- Version Management: 3
- Docker: 3
- CI/CD: 5
- Git Hooks: 3
- VS Code: 4
- Build Config: 3
- App-Specific: 15+
```

---

## 🎓 QUICK REFERENCE

| Need | File | Command |
|------|------|---------|
| Format code | `.prettierrc` | `npm run format` |
| Lint code | `.eslintignore` | `npm run lint` |
| Debug app | `.vscode/launch.json` | `F5` |
| Run tests | `.husky/pre-commit` | `npm test` |
| Deploy | `.github/workflows/deploy.yml` | `git push origin main` |
| Set Node version | `.nvmrc` | `nvm use` |
| Run in Docker | `Dockerfile` | `docker build .` |
| Local dev setup | `docker-compose.yml` | `docker-compose up` |
| Commit message | `.commitlintrc` | `git commit -m "feat: xyz"` |
| Environment vars | `.env.example` | Copy to `.env` |

