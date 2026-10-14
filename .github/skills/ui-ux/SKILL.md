---
name: ui-ux
description: Apply accessible responsive UI/UX design, visual hierarchy, typography, color, and research practices to PopChoice.
---

# UI/UX skill

Use this skill for layout, styling, visual hierarchy, interaction states, accessibility, responsive behavior, usability reviews, or browser-based UI testing.

## Repository context

PopChoice is a React + Vite frontend. `index.html` defines the document shell, `src/App.jsx` composes the preference and results experience, and `src/styles/index.css` defines the visual system and responsive layout.

## Design checklist

- **Whitespace:** use consistent padding and margins to separate content and clarify grouping.
- **Alignment:** keep headers, form controls, actions, status messages, and result cards visually aligned.
- **Contrast:** check WCAG contrast requirements for text, controls, focus indicators, and states; never make color the only signal.
- **Scale:** use responsive widths and `rem`/`em` sizing where appropriate, with mobile-first behavior.
- **Typography:** keep the type system focused, establish a clear size/weight hierarchy, and consider line height, letter spacing, italics, and color.
- **Color:** preserve the current deep navy background, white text, green accent, popcorn branding, Carter One headings, and Roboto Slab body text unless a redesign is requested. Use color consistently with its intended product meaning.
- **Hierarchy:** make the user's preference form and primary action obvious, then make loading status and recommendations easy to scan.

## Interaction and implementation rules

- Treat initial, focused, loading, successful, empty, and error states as one journey.
- Preserve the JavaScript selectors and classes unless all references are updated together.
- Prefer semantic HTML and native controls.
- Keep visible focus states and keyboard operation intact.
- Keep transitions lightweight and respect reduced-motion preferences.
- Keep dynamic recommendation text sanitized through the existing `DOMPurify` pattern; do not introduce unsanitized HTML.
- Avoid adding dependencies for isolated presentational changes.
- Do not add Optimizely, Hotjar, or other tracking/experimentation without explicit approval and a defined research purpose.

## Validation

Run:

```bash
npm run build
```

For browser-facing changes, check narrow and desktop viewports, keyboard navigation, focus visibility, form submission/loading recovery, recommendation cards with and without posters, and empty/error messages. Use Playwright when browser automation is useful.
