# Design

## Overview

Dark sport operations dashboard for a friendly World Cup prediction tournament. The interface is public, read-only, and optimized for scanning standings, match status, player trends, and prize information.

## Theme

Scene: participants check the standings during evening matches on phones and laptops, often with a live game nearby. A dark interface reduces glare and makes live/status accents easier to read.

## Color

Use OKLCH tokens through CSS variables. Base surfaces are dark tinted neutrals, with a controlled full-palette vocabulary for sport states:

- Background: near-black green-blue neutral, never pure black.
- Surface: elevated dark neutral with subtle borders.
- Primary accent: electric grass green for leaders, positive scoring, and current selection.
- Secondary accent: tournament gold for prize zones and trophies.
- Info accent: cool cyan for live/scheduled match metadata.
- Danger accent: warm red for misses and locked/error states.

## Typography

Use a system sans stack for product credibility and fast rendering. Keep headings compact, data labels precise, and tables dense. Do not use display fonts, fluid type, or decorative letter spacing.

## Layout

Use a top navigation shell, responsive stat bands, dense tables, and focused detail pages. Cards are for individual repeated entities and stat panels only. Avoid nested cards. Tables collapse into mobile-friendly stacked rows where needed.

## Components

- Stat panels: compact, numeric, with a meaningful status label.
- Leaderboard rows: rank, player identity, points, hit breakdown, average, accuracy, last-five form.
- Match cards: teams, kickoff, stage, status, prediction count, result when known.
- Badges: small semantic pills with text plus color, not color alone.
- Charts: simple Recharts line/bar visualizations with muted grid lines and clear legends.

## Motion

Use short 150-200ms transitions for hover and state changes only. No decorative page-load choreography.
