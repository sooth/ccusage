# GitHub Actions Workflows

## Workflows

### 1. CI (`ci.yaml`)

- Runs on every push and pull request
- Executes linting, type checking, and tests
- Ensures code quality

### 2. NPM Publish (`release.yaml`)

- Triggered when a tag is pushed
- Publishes the package to npm
- Creates a GitHub release with changelog

### 3. Build Binaries (`build-binaries.yaml`)

- Runs on main branch pushes and PRs
- Builds standalone executables for all platforms
- Useful for testing binary compilation
- Artifacts available for 7 days

### 4. Build Release (`build-release.yaml`)

- Triggered by version tags (e.g., `v1.0.0`)
- Builds binaries for all platforms:
  - Linux x64
  - macOS x64 (Intel)
  - macOS ARM64 (Apple Silicon)
  - Windows x64
- Creates GitHub release with all binaries attached

## Creating a Release

1. Update version in `package.json`
2. Commit changes
3. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically:
   - Build binaries for all platforms
   - Create a GitHub release
   - Attach all binaries to the release

## Manual Binary Build

You can also trigger a manual build:

1. Go to Actions tab
2. Select "Build Binaries" workflow
3. Click "Run workflow"
4. Download artifacts from the workflow run
