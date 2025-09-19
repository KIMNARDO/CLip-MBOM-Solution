# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manufacturing BOM (Bill of Materials) management solution with Excel-like functionality for multi-level BOM management. FabsNet's EPL (Engineering Parts List) Multi-BOM system.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build and watch Tailwind CSS
npm run tailwind

# Preview production build
npm run preview
```

## Architecture & Key Files

### Core Structure
- **Entry point**: `src/index.html` → redirects to login
- **Main app**: `src/pages/multi-bom.html` - Primary BOM management interface
- **Grid configuration**: `src/js/grid-config.js` - ag-Grid setup and column definitions
- **Data management**: `src/js/mbom-core.js` - Core BOM data operations

### Key JavaScript Modules
- **BOM Manager** (`bom-manager.js`): Handles BOM operations and data persistence
- **Grid Config** (`grid-config.js`): ag-Grid setup with row dragging, inline editing, context menus
- **Context Menu** (`context-menu.js`): Right-click operations for BOM items
- **Level Management** (`level-management.js`, `dynamic-level-system.js`): Multi-level assembly structure
- **Notification System** (`unified-notification-manager.js`): Status updates and alerts

### UI Framework
- **ag-Grid Enterprise**: Tree data structure with hierarchical BOM display
- **Tailwind CSS**: Styling via `tailwind.config.js` and custom components
- **Radix UI**: Dialog, dropdown, and other UI components

## BOM Data Structure

### Hierarchical Levels
```
Level 0: Assembly (ASSY) - Top level
├── Level 1: Sub-assembly
│   └── Level 2: Components
│       └── Level 3+: Sub-components
```

### Essential Fields
- `level`: Assembly depth (0, 1, 2, 3+)
- `partNumber`: Unique part identifier
- `quantity`: Required amount (Level 0 always = 1)
- `status`: approved | review | draft | rejected
- `diff_status`: E-BOM vs M-BOM comparison

### Status Color Coding
- Blue: Search match highlight
- Gray: Deployed/pending approval
- Pink: Missing required values
- Green: Matches current EONO
- Yellow: Modified items
- Red: Deleted items
- Orange: Already registered in PDM

## ag-Grid Configuration

Key GridOptions settings in `grid-config.js`:
- Tree Data enabled for hierarchical display
- Row dragging with `rowDragManaged: true`
- Double-click to edit cells
- Context menu integration
- Custom cell renderers for images/special fields

## Common Development Tasks

### Adding New BOM Features
1. Update column definitions in `grid-config.js`
2. Modify data structure in `mbom-core.js`
3. Add UI controls in `multi-bom.html`
4. Update context menu items if needed

### Working with Notifications
- Use `UnifiedNotificationManager` for all alerts
- Status updates via `sidebar-notifications.js`
- Toast notifications for user actions

### Level Management
- Dynamic level system allows flexible depth
- User-specific level settings in `user-level-settings.js`
- Persistence managed by `level-persistence.js`

## Testing Approach

While no formal test framework is configured, testing can be done via:
- Browser DevTools for JavaScript debugging
- Manual testing through the UI
- Playwright is installed for potential E2E testing setup

## Important Notes

- The system uses Vite as the build tool with `src` as root directory
- No backend API is currently implemented - data is managed client-side
- Authentication is handled via `auth.js` with localStorage
- The project structure suggests future WebSocket integration for real-time updates

## github 푸쉬를 위해 다음 정보 사용:
GIT HUB의 Personal Access Token:
[토큰은 별도 보관]
GitHub 주소: https://github.com/KIMNARDO/CLip-MBOM-Solution

## 원격 저장소에 푸시할 때, 먼저 HTTP 버퍼 크기를 늘리고 조금 씩 나누어 푸시할 것. 에러 시 작은 변경사항만 포함하는 새커밋을 만들어 푸시할 것

## github cli설치했어. gh 명령어 사용 가능해. 이걸로 github 처리해줘. 
( https://cli.github.com 에서 github cli 설치하시면 원활히 깃허브 작동됩니다. 영상에서는 빠져있지만, 이 설정 추천드립니다.)