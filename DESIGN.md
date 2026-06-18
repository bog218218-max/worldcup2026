# Design

## Overview

World Cup 2026 inspired broadcast dashboard for a friendly prediction tournament. The interface is public, read-only, and optimized for scanning standings, match status, player trends, and prize information without using official FIFA marks.

## Theme

Scene: participants check the standings during evening matches on phones and laptops, often with a live game nearby. A dark broadcast base reduces glare, while light score panels and host-city accents make the page feel closer to a tournament feed than a generic admin app.

## Color

Use OKLCH tokens through CSS variables. Base surfaces are dark tinted neutrals, with a full-palette vocabulary inspired by the tri-host 2026 context:

- Background: deep ink neutral, never pure black.
- Surface: dark broadcast panels with bright score tiles.
- Primary accent: pitch green for leaders and positive scoring.
- Secondary accent: trophy gold for prizes and exact-score moments.
- Host accents: vivid blue and warm red used sparingly for navigation, match status, and visual rhythm.
- Danger accent: warm red for misses and locked/error states.

## Typography

Use a system sans stack for product credibility and fast rendering. Keep headings compact, data labels precise, and tables dense. Do not use display fonts, fluid type, or decorative letter spacing.

## Layout

Use a top navigation shell, a stronger first screen, responsive stat bands, dense tables, and focused detail pages. Cards are for individual repeated entities and stat panels only. Add subtle pitch-line and broadcast-rule patterns for tournament identity. Avoid nested cards. Tables collapse into mobile-friendly stacked rows where needed.

## Components

- Stat panels: compact, numeric, with a meaningful status label.
- Leaderboard rows: rank, player identity, points, hit breakdown, average, accuracy, last-five form.
- Match cards: teams, kickoff, stage, status, prediction count, result when known.
- Badges: small semantic pills with text plus color, not color alone.
- Charts: simple Recharts line/bar visualizations with muted grid lines and clear legends.

## Motion

Use short 150-200ms transitions for hover and state changes only. No decorative page-load choreography.
