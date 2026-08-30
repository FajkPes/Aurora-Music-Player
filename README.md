# Aurora Music Player

Aurora is a highly customizable, visualization-focused local music player. I created it to combine everyday playlist management with a reactive visual experience that makes bass, mids, highs, loudness, tempo, and beats feel visible—not just audible.

The app runs locally as a single HTML file. Your music stays on your computer and is selected through the browser's file picker.

## Highlights

- Reactive multi-layer background driven by bass, mids, highs, loudness, tempo, and beat detection
- Real-time spectrogram waterfall, waveform timeline, trails, sparkles, mirrors, glitch, scanline, vignette, and color effects
- Playlist search, shuffle, repeat, favorites, file/folder import, and bulk analysis
- Smart artist/title detection from filenames (the app does not read ID3 tags)
- EBU R128-style loudness analysis with a configurable LUFS target
- Saved per-file loudness profiles, play statistics, favorites, and optional waveform cache
- Full settings and loudness-profile JSON import/export
- Extensive control over fonts, glass panels, colors, mappings, response curves, sensitivity, and performance

## Quick start

### Windows

1. Download and extract the release ZIP.
2. Double-click **START AURORA.bat**.
3. Select MP3/audio files or a music folder.

You can also open **Aurora Music Player.html** directly in a modern Chromium-based browser such as Chrome, Edge, or Brave.

No installation, Node.js, Python, or package manager is required. An internet connection is optional and is used only for Google Fonts; the player falls back to system fonts when offline.

## Apply the included Best Settings preset

1. Start Aurora and open **Settings** using the gear icon.
2. Open the **Data** tab.
3. Under **Full settings (all)**, click **Import JSON**.
4. Select **Best Settings.json** from the extracted folder.

The import replaces the current app settings. Export your current settings first if you want a backup. Loudness profiles are stored and imported separately from the same **Data** tab.

## How to use

- Add individual files with **Files**, or import a directory with **Folder**.
- Use the playlist panel to search, select, favorite, shuffle, or repeat tracks.
- Open **Settings → Audio** to configure normalization, the target LUFS value, live analysis, and band sensitivity.
- Use **Analyze all** to prepare loudness data for the whole current playlist.
- Customize the visualization under **Background**, **Spectrogram**, and **Control Island**.
- Export settings and loudness profiles from **Settings → Data** before clearing browser data or moving to another browser/computer.

## Data and privacy

Aurora processes audio locally with the browser's Web Audio API. It does not upload music or analysis data. Settings and loudness profiles are stored in browser `localStorage`, keyed partly by the exact filename. Clearing site/file data in the browser can remove those saved values, so use the JSON export buttons for backups.

## Compatibility notes

- Folder import uses the browser's directory picker and works best in Chromium-based browsers.
- Clipboard-based curve copy/paste can be restricted on local `file://` pages by browser security rules; the rest of the player remains usable.
- Very large playlists and high-detail visual effects can use substantial CPU/GPU resources. Aurora includes performance controls in Settings.

## Included files

- `Aurora Music Player.html` — the complete application
- `START AURORA.bat` — Windows launcher
- `Best Settings.json` — recommended visual and playback configuration

## Credits

Created by FajkPes with assistance from ChatGPT Codex and Claude Code.

## License

No open-source license has been granted. All rights are reserved by the author unless a license is added later.
