
# **Design System — Kandy Garden Club (KGC)**

This document defines the design tokens and UI standards for the Kandy Garden Club web application, ensuring a consistent "Heritage Elite" aesthetic across all member touchpoints.

## **1. Color Tokens (The Heritage Palette)**
Our palette reflects the 1878 heritage of the club, moving away from generic blue/slate to a high-contrast "Obsidian & Emerald" foundation.

* **Primary (Obsidian):** `#05070a` — *Base page backgrounds, Hero sections, and high-contrast foundations.*
* **Secondary (Emerald):** `#065f46` — *Brand identity, successful actions, and primary button states.*
* **Accent (Amber):** `#fbbf24` — *Senior Member highlights, luxury highlights, and high-value CTAs.*
* **Surface (Alabaster):** `#FAF9F6` — *Secondary section backgrounds, card surfaces, and subtle UI depth.*
* **Text (Base):** `#05070a` — *Maximum legibility for primary headings.*
* **Text (Muted):** `#6b7280` — *Soft charcoal for secondary descriptions and body text.*
* **Border:** `#e2e8f0` — *Subtle separation lines for Alabaster surfaces.*

## **2. Typography Scale (Archival Scale)**
We use a dual-font system: **Serif** for prestige and **Sans-Serif** for functional clarity.

* **Heading 1 (Hero):** `2.25rem (36px)` up to `8rem (128px)` | Serif | Italic | Leading: Tight
* **Heading 2 (Section):** `1.875rem (30px)` up to `4.5rem (72px)` | Serif | Semi-Bold
* **Heading 3 (Card):** `1.5rem (24px)` up to `2.25rem (36px)` | Serif | Semi-Bold
* **Body (Base):** `1rem (16px)` up to `1.25rem (20px)` | Sans-Serif | Light | Leading: 1.6
* **Registry Label:** `0.65rem (10px)` | Sans-Serif | Black | Uppercase | Tracking: 0.4em

## **3. Spacing Scale**
Generous spacing is used to maintain a "Country Club" sense of breathing room.

* **Section Padding:** `py-20` (Ensures distinct separation between page areas).
* **Container Padding:** `px-6 lg:px-20` (Consistent horizontal gutters).
* **Gap (Grid/Flex):** `gap-8` (Cards), `gap-20` (Between Header and Content).
* **Corner Radius (Club):** `3rem (48px)` — *Our signature "Soft Corner" for all main cards.*
* **Corner Radius (UI):** `1rem (16px)` — *Standard for buttons and form inputs.*

## **4. Button Variants**
Standardized interactive elements with high-contrast hover effects.

* **Primary (Steward):** Filled Obsidian, white text, 0.4em tracking, hover to Emerald.
* **Highlight (Senior):** Filled Amber, obsidian text, 0.4em tracking, hover to White.
* **Outline (Registry):** Transparent, border-gray-200, obsidian text, hover to Alabaster.
* **Disabled:** Lower opacity (40%), grayscale filter, no pointer events.

## **5. Component Patterns**
* **Card:** Alabaster background, `rounded-club`, thin border, subtle shadow on hover.
* **Badge:** Small, black uppercase text, 0.4em tracking, high-contrast background (Emerald/Amber).
* **Input:** Alabaster background, `rounded-2xl`, focus ring in Emerald, 1rem padding.

---
