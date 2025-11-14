# Planning Guide

A comprehensive Vietnam Lottery Result Viewer that displays lottery results across multiple game types with real-time updates, historical tracking, and statistical analysis.

**Experience Qualities**:
1. **Trustworthy** - Users need confidence in the accuracy and timeliness of lottery results displayed
2. **Efficient** - Quick access to current and historical results without unnecessary navigation or complexity
3. **Clear** - Information hierarchy that makes numbers immediately readable and game types instantly distinguishable

**Complexity Level**: Light Application (multiple features with basic state)
  - Manages multiple lottery game types, result history, and user preferences while maintaining a focused single-page experience

## Essential Features

### Live Result Display
- **Functionality**: Shows the most recent lottery results for all active game types with real-time data fetching from xoso.com.vn for Northern region
- **Purpose**: Primary user need - checking current winning numbers quickly with real, verified data
- **Trigger**: Page load or manual refresh
- **Progression**: App loads → Fetches latest results from xoso.com.vn for Northern region → Latest results appear prominently → Each region/game type clearly labeled → Numbers displayed in traditional lottery format
- **Success criteria**: Northern results fetched from live source, results visible within 2 seconds, all numbers clearly readable, draw date/time visible

### Multi-Region Support
- **Functionality**: Displays results for three main Vietnamese lottery regions (Miền Bắc, Miền Trung, Miền Nam)
- **Purpose**: Different regions have different lottery systems and users follow specific regions
- **Trigger**: Tab selection or region filter
- **Progression**: User selects region → Results filter to show only that region → Prize tiers displayed in traditional format → Special prizes highlighted
- **Success criteria**: Region switching is instant, prize structure matches traditional Vietnamese lottery format

### Historical Results Archive
- **Functionality**: Browse past lottery results by date and region
- **Purpose**: Users want to check previous draws, analyze patterns, verify old tickets
- **Trigger**: Date picker selection or "View History" button
- **Progression**: User clicks history → Calendar/date picker appears → User selects date → Historical results for that date display → Can navigate between dates
- **Success criteria**: At least 30 days of historical data accessible, date navigation is smooth

### Prize Breakdown Display
- **Functionality**: Shows all prize tiers (Special, First, Second, Third, etc.) with corresponding numbers
- **Purpose**: Vietnamese lottery has complex prize structures that need clear organization
- **Trigger**: Automatic with result display
- **Progression**: Results load → Prize tiers arranged from highest to lowest → Each tier clearly labeled → Numbers formatted traditionally
- **Success criteria**: All 8+ prize tiers visible, special prize most prominent, layout matches familiar lottery ticket format

### Number Search/Check
- **Functionality**: Enter a lottery number to check if it won any prize
- **Purpose**: Quick ticket verification without scanning entire result table
- **Trigger**: User enters number in search field
- **Progression**: User types number → Live search highlights matches → Prize tier(s) displayed → Winning amount shown (if applicable)
- **Success criteria**: Search responds within 100ms, partial matches highlighted, clear win/no-win indication

## Edge Case Handling

- **No Results Available**: Display friendly empty state with last update timestamp and refresh option
- **Invalid/Future Dates**: Show informative message when user selects date with no results yet
- **Slow/Failed Updates**: Graceful loading states with spinner, cached previous results remain visible, retry mechanism with multiple CORS proxies
- **CORS/Network Errors**: Fallback to demo data when xoso.com.vn cannot be reached, with clear user notification
- **Number Format Errors**: Accept various input formats (with/without spaces, 2-6 digits), normalize automatically
- **Multiple Matches**: When searched number appears in multiple prize tiers, show all matches clearly ranked
- **Regional Variations**: Handle different prize structures per region without confusion
- **HTML Parsing Failures**: Multiple selector strategies for robust data extraction from xoso.com.vn

## Design Direction

The design should evoke trust and clarity with a modern Vietnamese aesthetic - feeling both official and accessible. Draw inspiration from traditional lottery ticket layouts while applying contemporary digital polish. The interface should feel authoritative yet approachable, with a minimal aesthetic that prioritizes number readability above all else.

## Color Selection

Triadic color scheme - using Vietnamese cultural colors (red for fortune/luck, gold for prosperity, deep blue for trust) balanced with modern neutrals.

- **Primary Color**: Deep Red `oklch(0.45 0.19 25)` - Evokes luck and prosperity in Vietnamese culture, used for special prizes and primary actions
- **Secondary Colors**: Rich Gold `oklch(0.75 0.15 85)` for accents and highlights (prosperity association), Navy Blue `oklch(0.35 0.08 250)` for structure and trust
- **Accent Color**: Vibrant Gold `oklch(0.80 0.18 90)` - Draws attention to winning numbers and call-to-action elements
- **Foreground/Background Pairings**: 
  - Background (Warm Cream #FFF9F0 / `oklch(0.99 0.02 85)`): Dark text `oklch(0.20 0.02 25)` - Ratio 13.1:1 ✓
  - Card (White #FFFFFF / `oklch(1 0 0)`): Dark text `oklch(0.20 0.02 25)` - Ratio 15.2:1 ✓
  - Primary (Deep Red `oklch(0.45 0.19 25)`): White text `oklch(0.99 0 0)` - Ratio 6.8:1 ✓
  - Secondary (Navy Blue `oklch(0.35 0.08 250)`): White text `oklch(0.99 0 0)` - Ratio 8.2:1 ✓
  - Accent (Vibrant Gold `oklch(0.80 0.18 90)`): Dark text `oklch(0.20 0.02 25)` - Ratio 9.1:1 ✓
  - Muted (Light Beige `oklch(0.95 0.01 85)`): Medium text `oklch(0.45 0.02 25)` - Ratio 7.5:1 ✓

## Font Selection

Typography should convey authority and clarity with excellent number readability - using a clean sans-serif with distinctive numerals for the lottery numbers and a traditional-feeling font for Vietnamese text.

- **Typographic Hierarchy**: 
  - H1 (Region Title): Inter Bold / 32px / -0.02em letter spacing / 1.2 line height
  - H2 (Prize Tier): Inter Semibold / 20px / -0.01em letter spacing / 1.3 line height
  - H3 (Date/Time): Inter Medium / 16px / normal letter spacing / 1.4 line height
  - Lottery Numbers: JetBrains Mono Bold / 28px / 0.05em letter spacing / Monospace for alignment
  - Body Text: Inter Regular / 15px / normal / 1.5 line height
  - Small/Meta: Inter Regular / 13px / normal / 1.4 line height

## Animations

Animations should reinforce the excitement of lottery results while maintaining professional restraint - subtle number reveals and smooth transitions between regions create anticipation without distraction.

- **Purposeful Meaning**: Number reveals use staggered fade-in to create anticipation, prize tier expansion feels ceremonial yet quick, region switches slide smoothly to maintain spatial context
- **Hierarchy of Movement**: Special prize gets most dramatic reveal (scale + fade), regular prizes cascade in, search matches pulse subtly to draw attention

## Component Selection

- **Components**: 
  - Tabs (region selection) - customized with Vietnamese region icons, active state uses primary red
  - Card (result containers) - elevated shadow, rounded corners at --radius, borders in gold accent
  - Calendar (date picker for history) - customized to highlight draw days, disable future dates
  - Input (number search) - large, centered, monospace font, auto-format as user types
  - Badge (prize tier labels) - color-coded by tier importance (special=red, first=gold, others=blue/gray)
  - Separator (between prize tiers) - subtle dotted lines in gold
  - Button (refresh, check ticket) - primary style for main actions, ghost for secondary
  - Skeleton (loading states) - shimmer animation for number placeholders
  - ScrollArea (historical results list) - smooth scrolling with fade indicators

- **Customizations**: 
  - Custom lottery number display grid (maintains traditional 2-digit, 3-digit, 5-digit formats)
  - Prize tier cards with traditional Vietnamese lottery layout
  - Animated number reveal component using framer-motion
  - Vietnamese date formatter utility

- **States**: 
  - Buttons: Default (solid red), Hover (darker red with subtle lift), Active (pressed inset), Disabled (muted gray)
  - Search Input: Empty (placeholder visible), Typing (live validation), Match Found (green border + check icon), No Match (subtle gray)
  - Result Cards: Loading (skeleton), Loaded (fade-in), Highlighted (when search matches)
  - Tabs: Inactive (muted), Active (primary red with bottom border), Hover (subtle background)

- **Icon Selection**: 
  - Trophy (special prize indicator) - Phosphor Trophy icon
  - Calendar (date picker) - Phosphor CalendarBlank
  - MagnifyingGlass (search/check) - Phosphor MagnifyingGlass
  - ArrowClockwise (refresh) - Phosphor ArrowClockwise
  - Star (highlight winning tier) - Phosphor Star filled
  - MapPin (region indicators) - Phosphor MapPin for North/Central/South

- **Spacing**: 
  - Page padding: px-6 py-8 (mobile), px-12 py-12 (desktop)
  - Card padding: p-6
  - Card gaps: gap-4 between elements, gap-6 between sections
  - Number grids: gap-3 for visual breathing
  - Prize tiers: space-y-4 for clear separation

- **Mobile**: 
  - Tabs become horizontal scrollable carousel on mobile
  - Number grids stack vertically, reduce font size slightly (24px)
  - Date picker becomes bottom sheet drawer instead of popover
  - Search input becomes sticky header on scroll
  - Prize tiers use accordion collapse on mobile to save space
  - Reduce padding to px-4 py-6 on mobile
