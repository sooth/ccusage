# GitHub Actions Workflows

This directory contains automated workflows for the ccusage project.

## Workflows

### release.yml

Triggers on version tags (v\*) and automatically:

1. Builds the project
2. Creates Linux x64, macOS x64, and macOS ARM64 binaries
3. Packages them as compressed archives (.tar.gz)
4. Creates a GitHub release with all binaries attached

To create a release:

```bash
# Update version in package.json
npm version patch  # or minor/major

# Push the tag
git push origin v18.1.3
```

### ci.yml

Runs on all pushes to main and pull requests:

1. Lints the code
2. Runs type checking
3. Runs tests
4. Builds the project
5. Tests binary compilation

## Notes

- Windows binaries have been removed as requested
- Workflows use Bun for fast builds and testing
- Dependencies are cached for improved performance
- The release workflow uses GitHub CLI (gh) for robust release creation
  EOF < /dev/null
