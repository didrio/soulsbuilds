# Exporting the game data (Windows, Smithbox)

The owner runs this on the Windows PC; the result is copied to the Mac, where `npm run data` turns it into
`src/data/er/` and `public/assets/icons/`. Re-run it after a game patch. Written for **Smithbox 2.2.6** (menu
names checked against its source); newer versions may move things.

You only **read** game files here. Never save in Smithbox, never use "Patch" in any tool, and never put files
into the game folder. Nothing in the game install changes.

**You need:** Elden Ring + Shadow of the Erdtree installed (Steam default:
`C:\Program Files (x86)\Steam\steamapps\common\ELDEN RING`) and Smithbox 2.2.6 unzipped anywhere. About 30–60
minutes, mostly waiting. If a screen doesn't match these steps, take a screenshot and send it over instead of
guessing.

## 0. Folders

Create these empty folders in File Explorer:

```
C:\soulsbuilds-export\
C:\soulsbuilds-export\project\
C:\soulsbuilds-export\params\
C:\soulsbuilds-export\text\
C:\soulsbuilds-export\icons\
```

## 1. Start Smithbox and create a project

1. Open the Smithbox folder and double-click **`Smithbox.Vulkan.exe`**. (Use this one: the texture export in
   step 4 doesn't work in `Smithbox.OpenGL.exe`. If Vulkan closes immediately, tell me and we'll export the icons
   another way.)
2. In the project screen, under **Actions**, click **Define New Project** and fill in:
   - **Project Name:** `soulsbuilds-export`
   - **Project Type:** **Elden Ring** (not "Elden Ring: Nightreign")
   - **Project Directory:** click **Select Project Directory** → `C:\soulsbuilds-export\project`
   - **Data Directory:** click **Select Data Directory** →
     `C:\Program Files (x86)\Steam\steamapps\common\ELDEN RING\Game` (the folder with `eldenring.exe`)
   - **Available Editors:** tick only **Param Editor**, **Text Editor** and **Texture Viewer**, untick the
     rest (the map and model editors take a long time to load and aren't needed).
3. Click **Create Project**. If it's listed under **Available Projects** but not loaded, right-click it →
   **Load**. Wait until the log at the bottom stops moving (a minute or two).

## 2. Params → CSV

1. Open the **Param Editor**. If it asks whether to import English row names, click **Yes**: they're
   community labels for the rows, stored in the project folder only, and they make the CSVs readable.
2. In the list of params on the left, click any param, e.g. **EquipParamWeapon** (the export menu stays grey
   until one is selected).
3. In the Param Editor's menu bar: **Tools → Data Transfer → Export CSV → All Params → Export All Params to
   File**.
4. In the folder dialog, pick `C:\soulsbuilds-export\params` and confirm.

Same result from the **Data Transfer** panel (its **Export** tab), if that's what you have open: **Export
Mode: File**, **Export Type: All Params**, **Set Export Directory** → `C:\soulsbuilds-export\params`, then
**Export to File**.

**Check:** `C:\soulsbuilds-export\params` has a few hundred `.csv` files, including `EquipParamWeapon.csv`,
`EquipParamProtector.csv`, `EquipParamAccessory.csv`, `EquipParamGoods.csv`, `EquipParamGem.csv`,
`Magic.csv` and `SwordArtsParam.csv`. Each starts with a line like `ID,Name,...`.

## 3. Text → dump

1. Open the **Text Editor**.
2. In its menu bar: **Tools → Text Dump → Dump**.
3. Pick `C:\soulsbuilds-export\text` and confirm. Wait for "Finished dumping all text entries." in the log.

**Check:** inside `C:\soulsbuilds-export\text` there's a folder per language (e.g. `engus`) with `item` and
`menu` folders of `.txt` files. In `engus\item` you should see files whose names contain `WeaponName`, including
ones ending in `_dlc01` and `_dlc02` (the DLC). Other languages can stay; the pipeline uses English only.

## 4. Icons → PNG

1. Open the **Texture Viewer**.
2. Find the panel with a **Data Export** section (if you don't see it: **View → Tools**). Expand **Data
   Export**:
   - **Export File Type:** **PNG**
   - Click **Select Output Directory** → `C:\soulsbuilds-export\icons` (the box under **Export** shows
     the path)
   - **Options:** untick **Display Export Confirmation** (so thousands of files don't each ask);
     **Include Container Folder** can stay as it is (the pipeline searches subfolders)
   - Don't use the **Export Texture** button: it exports only the one texture on screen.
3. In the texture viewer's category tabs, open **HD Icons**. Right-click **`/menu/hi/00_solo.tpfbhd`** →
   **Export → All Textures**, and wait for the progress window to close. Export **only** the `hi` one: the
   `/menu/low/00_solo.tpfbhd` next to it holds the same icons at lower resolution with the same file names,
   so it would overwrite them.

**Check:** `C:\soulsbuilds-export\icons` holds thousands of PNGs with names like `MENU_Knowledge_00001.png`
(the exact prefix may differ; send me a few names either way). Note the folder's total size
(right-click → Properties). If it's over ~3 GB, tell me before copying.

## 5. Copy to the Mac

1. Optional but useful: create `C:\soulsbuilds-export\VERSION.txt` with today's date and the game version
   (bottom-right of the game's title screen, e.g. `1.16.1`).
2. Delete `C:\soulsbuilds-export\project` (Smithbox's own files, not needed).
3. Right-click `C:\soulsbuilds-export` → **Compress to ZIP file** (Windows 11: **Compress to → ZIP File**).
4. Copy the ZIP to the Mac however is easiest (USB stick, a cloud drive, a network share).
5. On the Mac, unzip it so the folders end up at:

```
~/Documents/soulsbuilds-gamedata/params/
~/Documents/soulsbuilds-gamedata/text/
~/Documents/soulsbuilds-gamedata/icons/
```

That folder stays **outside the repo** and is never committed: it's FromSoftware's files. Only the derived
JSON and the resized icons the site uses go into git.

## Notes

- Smithbox (vawser/Smithbox) is GPL-3.0. We run it; we don't ship it, so the license doesn't apply to our code.
- Nuxe isn't needed: Smithbox reads the game archives directly. If Nuxe is ever used, use **Unpack** only,
  never **Patch** (Patch modifies the game's exe).
- What the export looks like and how the pipeline reads it: `docs/data.md`.
