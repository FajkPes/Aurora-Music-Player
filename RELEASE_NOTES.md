# Aurora Music Player v6.31

This corrected release makes English the reliable default throughout the complete application, including dynamically generated settings and status messages.

## Fixed in v6.31

- Translated the complete dynamic background-layer editor, including descriptions, shape names, motion paths, tooltips, and generated layer summaries.
- Translated runtime status messages, import errors, favorite tooltips, date labels, and the drag-and-drop overlay.
- Added translation handling for text and tooltip changes made after startup.
- Reset the language preference version so an old Czech selection cannot silently override the new English default.
- Changed English date and time formatting to the `en-GB` locale.
- Added a rendered-DOM language audit and an old-profile migration test.

## Included

- Aurora Music Player v6.31
- Windows one-click launcher
- Recommended Best Settings preset
- English setup, feature, privacy, and usage documentation

## Requirements

- Windows, macOS, or Linux
- A modern web browser; a Chromium-based browser is recommended
- No runtime or package installation

## Known limitations

- Artist and title recognition uses filenames rather than ID3 metadata.
- Browser storage is local to the specific page/browser context; export settings and loudness profiles before clearing browser data.
- The optional web fonts require internet access, but system-font fallbacks work offline.

Created by FajkPes with assistance from ChatGPT Codex and Claude Code.
