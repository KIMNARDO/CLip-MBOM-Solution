# Revision History

## v2.0.0 - 2025-09-20
### Major Features
- **Complete Theme System Implementation**
  - Added ThemeContext for global theme state management
  - Implemented light/dark mode toggle with localStorage persistence
  - Applied theme to ALL components (100+ instances of hardcoded colors removed)
  - Synchronized theme across layouts, sidebars, data grids, and all tab sections

- **Enhanced Level Visualization System**
  - Created EnhancedLevelIndicator component with visual hierarchy
  - Implemented gradient-based level colors for better readability
  - Synchronized level colors across sidebar and dashboard components
  - Applied subtle transparent backgrounds instead of heavy gradients

- **Grid Column Reorganization**
  - Repositioned U/S (quantity) column to appear after PART NAME
  - Updated column definitions in BOMContext.jsx for TreeGrid
  - Maintained consistency across all grid implementations

### Technical Improvements
- Fixed background image display issues (changed from EPL_Head.png to building.jpg)
- Changed default active tab from 'structure' to 'dashboard' after login
- Removed all hardcoded RGB colors and replaced with theme-aware classes
- Improved ag-Grid theme switching between ag-theme-alpine and ag-theme-alpine-dark
- Enhanced visual readability with appropriate font and color contrasts for each theme

### Files Modified
- Created: ThemeContext.jsx, EnhancedLevelIndicator.jsx
- Modified: 20+ components to support theme system
- Updated: All grid components for consistent theme application
- Enhanced: Sidebar, dashboard, and notification components

---

## v1.0.0 - 2025-09-19
### Initial Release
- Basic M-BOM system with ag-Grid Enterprise
- UnifiedBOMGrid implementation
- Authentication system
- Multi-level BOM structure support
- Initial dark mode only interface

---

*Note: This file tracks major revisions and version changes. For detailed commit history, see git log.*