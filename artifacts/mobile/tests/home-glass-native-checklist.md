# Home glass: native accessibility acceptance

Automated checks: `pnpm --filter @workspace/mobile test:home-glass`.
These simulate the native preference API and verify opaque surface contrast;
they do not substitute for an iPhone rendering check.

## iPhone / Expo Go or native build

Run every combination:

| App appearance | iOS Reduce Transparency | Expected panels |
| --- | --- | --- |
| Light | Off | Light blur |
| Light | On | Solid white |
| Dark | Off | Dark blur |
| Dark | On | Solid dark blue |

1. In Settings → Accessibility → Display & Text Size, set Reduce Transparency.
2. Cold-launch the app for each row. Check the language selector (including its
   open menu), XP, journey stats, and mistake-review panel. With the preference
   enabled, decorative glows must not show through the panels.
3. Without closing the app, toggle Reduce Transparency both ways in Settings,
   then return to Home. Panels must update without a reload.
4. Change app appearance while Reduce Transparency stays enabled. Solid panels
   and readable text must track the selected appearance. Also check System
   appearance while changing the device between light and dark.
5. Confirm selector choices, navigation, review entry, and press animations still
   work. No layout changes, missing content, or transparent flash at launch.

## Contrast reference

The reduced-transparency fills are fully opaque; their contrast is independent
of the underlying glows. The automated check requires 4.5:1 for foreground,
secondary text, and the accent kicker; 3:1 for blue non-text icons.
Normal iOS blur and existing web/Android tinted fills are unchanged.

## Verification status

Native device verification has not been performed in this Linux workspace.
The matrix above must be checked on an iPhone before claiming native visual
acceptance. Browser screenshots can only verify the unchanged web fallback.
