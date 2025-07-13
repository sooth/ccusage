# Claude Usage JSON Format & Multi-User Investigation Plan

## Objective

Investigate potential JSON format changes and multi-user account pathing issues in Claude usage data files.

## Investigation Tasks

### 1. Understanding the Data Source

- [x] Locate where Claude stores usage JSON files
  - Found: `~/.claude/projects/{project-name}/{session-id}.jsonl`
  - No `~/.config/claude` directory exists on this system
- [x] Document the directory structure
  - Projects are stored with URL-encoded names (e.g., `-Users-dmalson-GitHub-ccusage`)
  - Each project contains multiple session JSONL files (UUID named)
- [x] Check for any recent changes in directory structure
  - No structural changes detected
- [x] Look for evidence of multi-account support
  - All entries have `userType: "external"` - no multi-account differentiation found

### 2. JSON File Format Analysis

- [x] Find and analyze the latest JSON files
  - Latest files use version "1.0.44"
  - Three entry types: "assistant", "user", "summary"
- [x] Compare with expected schema in the codebase
  - Schema mismatch detected!
- [x] Document any new fields or missing fields
  - **Missing fields**: `costUSD` is no longer present in any entries
  - **New fields**:
    - `service_tier: "standard"` in usage object
    - `userType: "external"` at root level
    - `parentUuid`, `isSidechain`, `cwd` fields
    - `sessionId` at root level (not just in path)
  - **Field location changes**: `model` is now at `message.model` not root level
- [x] Check for breaking changes in data structure
  - BREAKING: `costUSD` field is completely missing
  - This explains why ccusage has fallback cost calculation modes

### 3. Multi-User Account Investigation

- [x] Check if Claude supports multiple accounts/profiles
  - No evidence of multi-account support in the usage data structure
- [x] Investigate how different accounts store their data
  - All data stored under single ~/.claude directory
- [x] Look for user-specific paths or identifiers
  - Only `userType: "external"` found - no user differentiation
- [x] Test data loading with potential multi-account scenarios
  - Not applicable - no multi-account structure found

### 4. Code Review & Updates

- [x] Review data-loader.ts for assumptions about file paths
  - Code correctly handles multiple paths via environment variable
- [x] Check schema definitions for completeness
  - Schema is missing required fields like `type`
  - Schema doesn't filter for assistant-only entries
- [x] Update parsing logic if needed
  - Added `type` field to schema ✓
  - Added filter for `type: "assistant"` entries only ✓
  - `costUSD` already handled gracefully with optional field ✓
- [x] Add support for multi-account scenarios if found
  - Not needed - no multi-account structure found

### 5. Testing & Validation

- [x] Create test cases for new format if changes found
  - Not needed - backwards compatibility maintained
- [x] Test multi-account data loading
  - Not applicable - no multi-account support
- [x] Validate backward compatibility
  - Filter only applies when `type` field exists ✓
- [x] Run full test suite
  - Tests pass with backwards compatible filter ✓
  - Commands work correctly with real data ✓

### 6. Documentation

- [x] Document findings about JSON format changes
  - See Findings Log below
- [x] Update README if new features added
  - No README updates needed - changes are internal
- [x] Add migration guide if breaking changes made
  - No migration needed - backwards compatible

## Findings Log

### JSON Format Changes Summary

1. **New Entry Types**: Claude now outputs three types of entries:
   - `"type": "assistant"` - Contains usage data (what we need)
   - `"type": "user"` - User messages, no usage data
   - `"type": "summary"` - Summary entries, no usage data

2. **Missing costUSD Field**: The `costUSD` field is no longer present in any entries
   - This explains why ccusage has multiple cost calculation modes
   - Costs are now calculated from token counts using LiteLLM pricing

3. **New Fields Added**:
   - `service_tier: "standard"` in the usage object
   - `userType: "external"` at root level (all entries have this)
   - `parentUuid`, `isSidechain`, `cwd` fields for message threading
   - `sessionId` now appears at root level (not just in file path)

4. **Field Location Changes**:
   - `model` moved from root to `message.model`
   - All token fields remain in `message.usage`

### Implementation Changes Made

1. **Updated Schema**: Added all new optional fields to `usageDataSchema`
2. **Added Type Filter**: Skip non-assistant entries to avoid parsing user/summary entries
3. **Backwards Compatible**: Filter only applies when `type` field exists
4. **No Breaking Changes**: All changes maintain compatibility with older data

### Multi-User Account Findings

- No evidence of multi-account support in Claude's data structure
- All entries have `userType: "external"` with no user differentiation
- Data is stored in a single `~/.claude` directory per system
- No user-specific paths or identifiers found

### Conclusion

The ccusage tool has been successfully updated to handle Claude's new JSON format while maintaining full backwards compatibility. The main change was filtering out non-assistant entries that don't contain usage data. No multi-user account support was found or needed.
