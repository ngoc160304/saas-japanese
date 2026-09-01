# Front-End Design Guidelines - Dashboard System

This document outlines the UI/UX design standards and Front-End development rules analyzed directly from the provided dashboard system templates. The goal is to ensure consistency, modern aesthetics, accessibility (A11y) compliance, and optimal user experience across all system interfaces.

---

## 1. System Color Palette & Tokens Analysis

The color system delivers a professional, trustworthy, modern, and clean aesthetic with **Navy Blue** as the primary tone, complemented by **Sky Blue**, **Soft Slate**, and **Semantic Accents**.

### 1.1. Color Tokens Detail

| Color Token | Hex Code | Description & UI Usage |
| :--- | :--- | :--- |
| **Primary Main (Navy Dark)** | `#2B4C7E` / `#2D4B75` | Primary brand color. Used for Active Sidebar items, primary buttons, major chart data points. |
| **Primary Active Accent** | `#2F80ED` / `#3B82F6` | Vibrant blue accent. Used for active indicator bars, selected calendar dates, bar chart highlights, active badges. |
| **Secondary Light Blue** | `#56CCF2` / `#60A5FA` | Secondary supporting blue. Used for donut chart segments, heatmap blocks, secondary tags, hover states. |
| **Background Main** | `#F4F6F9` / `#F5F7FA` | Canvas background for the entire application. Soft light gray to reduce eye strain. |
| **Surface / Card Background** | `#FFFFFF` | Container background for Cards, Tables, Calendars, Headers. Separated from the Canvas by soft shadows/subtle borders. |
| **Text Primary (Dark)** | `#1E293B` / `#2C3E50` | Primary headings (H1–H6), key KPI metric values, primary table cell text. High contrast for readability. |
| **Text Secondary (Muted)** | `#64748B` / `#7F8C8D` | Subtitles, field labels, timestamps, inactive icons, metadata. |
| **Border & Divider** | `#E2E8F0` / `#EDF2F7` | Subtle border for table row dividers, card borders, and input fields. |

### 1.2. Semantic & Status Colors

| Status | Soft Fill Hex | Solid Text/Icon Hex | Usage Example |
| :--- | :--- | :--- | :--- |
| **Success / Enrolled** | `#E6F4EA` | `#22C55E` / `#16A34A` | **Enrolled / Active** badges, positive growth indicators (`+12.5%`). |
| **Warning / Pending** | `#FEF3C7` | `#F59E0B` / `#D97706` | **Applied / Pending** badges, warnings awaiting approval. |
| **Danger / Unpaid** | `#FEE2E2` | `#EF4444` / `#DC2626` | **Waitlisted / Unpaid / Draft / Archived** badges, negative metric trends (`-3.1%`). |
| **Category Pill** | `#E0F2FE` | `#0284C7` | Domain/category tags (Design, Web Dev, Marketing, Language). |

---

## 2. Typography System Analysis

The interface uses a modern **Geometric / Neo-Grotesque Sans-serif** typeface.
* **Recommended Fonts**: `Plus Jakarta Sans`, `Inter`, or `SF Pro Display`.
* **Key Characteristics**: Subtle rounded joints, clean numeric glyphs, balanced line heights for high readability.

### 2.1. Scale & Hierarchy

| Element | Font Size | Weight | Line Height | Case / Tracking | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (H1)** | `24px - 28px` | SemiBold (600) | `1.3` | Normal | `Good Morning, Noah!`, `Enrollments`, `Courses` |
| **Section Title (H2)** | `18px - 20px` | SemiBold (600) | `1.4` | Normal | `Payment Status Breakdown`, `Learning Activity` |
| **Card Header (H3)** | `15px - 16px` | SemiBold (600) | `1.4` | Normal | `UX/UI Design Fundamentals`, `Total Revenue` |
| **KPI Metric Value** | `24px - 32px` | Bold (700) | `1.2` | Normal | `$294,500`, `18,540`, `$946,210` |
| **Body Primary** | `14px` | Regular (400) / Medium (500) | `1.5` | Normal | Table text, main item descriptions |
| **Body Secondary / Caption** | `12px - 13px` | Regular (400) | `1.4` | Normal | Emails, phone numbers, timestamps (`May 18, 2030`), secondary labels |
| **Badge / Pill Tag** | `11px - 12px` | Medium (500) / SemiBold (600) | `1.0` | Sentence case | `Active`, `Enrolled`, `Pending`, `Web Dev` |

---

## 3. Layout & Grid System

### 3.1. Structure Overview
* **Sidebar Navigation (Fixed Left)**:
  * Width: `240px - 260px` (Expanded) or `80px` (Collapsed Icon mode).
  * Active Item: Border-radius `10px - 12px`, background `#2B4C7E`, white text `#FFFFFF`, left accent indicator bar.
* **Top Bar (Header)**:
  * Height: `70px - 80px`.
  * Components: Page Title, Global Search Input, Notifications Icon, Settings, Admin Profile Avatar.
* **Main Content Area**:
  * Flex container with padding: `24px - 32px`.
  * Card spacing / Grid gap: `20px - 24px`.

### 3.2. Responsive Grid
* **Main Dashboard Layout**: 12-column CSS Grid.
  * *Top Metrics*: `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`.
  * *Charts section*: 8-column main chart + 4-column side widgets (Calendar / Timelines).
  * *Data Tables / Lists*: Spans 12 columns full width.

---

## 4. UI Components & Micro-Interactions

### 4.1. Cards
* **Background**: `#FFFFFF`
* **Border Radius**: `16px` (Modern soft rounded corners).
* **Box Shadow**: Ultra-soft shadow: `0px 4px 20px rgba(0, 0, 0, 0.03)`. Avoid harsh, dark shadows.
* **Padding**: `20px` - `24px`.

### 4.2. Data Tables
* **Header Row**: Background `#F8FAFC` or transparent, text color `#64748B`, SemiBold `12px` with sort icons (`↕`).
* **Row Height**: `60px - 68px` for comfortable vertical spacing.
* **Dividers**: `border-bottom: 1px solid #F1F5F9`.
* **Hover State**: Subtle row background transition to `#F8FAFC`.

### 4.3. Badges & Pills
* **Style**: Full pill border-radius (`border-radius: 9999px`).
* **Padding**: `4px 12px`.
* **Color Rule**: Always use **Dark Solid Text + Soft Fill Tint** of the same color family (e.g., `#16A34A` text on `#E6F4EA` background).

### 4.4. Charts & Visualizations
* **Donut Chart / Heatmaps**: Use palette tones (`#2B4C7E`, `#2F80ED`, `#56CCF2`, `#E2E8F0`).
* **Tooltips**: White background, `8px` border-radius, soft shadow, bold metric text.

---

## 5. Front-End Implementation Guidelines

### 5.1. Tailwind CSS Configuration Reference
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#2B4C7E',
          blue: '#2F80ED',
          sky: '#56CCF2',
          bg: '#F4F6F9',
        },
        status: {
          successBg: '#E6F4EA',
          successText: '#16A34A',
          warningBg: '#FEF3C7',
          warningText: '#D97706',
          dangerBg: '#FEE2E2',
          dangerText: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'badge': '9999px',
      },
      boxShadow: {
        'card': '0px 4px 20px rgba(0, 0, 0, 0.03)',
      }
    },
  },
}
```

### 5.2. CSS Variables Template
```css
:root {
  --color-primary-navy: #2B4C7E;
  --color-primary-blue: #2F80ED;
  --color-accent-sky: #56CCF2;
  --color-bg-main: #F4F6F9;
  --color-surface: #FFFFFF;
  
  --color-text-primary: #1E293B;
  --color-text-secondary: #64748B;
  --color-border: #E2E8F0;
  
  --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --radius-card: 16px;
  --shadow-card: 0px 4px 20px rgba(0, 0, 0, 0.03);
}
```

---
*This document serves as the standard reference for UI Designers and Front-End Developers building the system dashboard web application.*