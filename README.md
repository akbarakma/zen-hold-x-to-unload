# Hold X to Unload Tab

A [Sine](https://github.com/CosmoCreeper/Sine) mod for Zen Browser: press and hold a tab's close button to unload it instead of closing it.

Unloading frees the tab's memory while keeping it in your tab bar, the same as right-clicking a tab and choosing Unload Tab. This mod puts that action one gesture away.

## How it works

- **Quick click** on the close button: the tab closes as always. The mod stays out of the way.
- **Press and hold**: a fill sweeps around the button while you hold. Once the hold completes, the X turns into a moon icon to show the tab is armed.
- **Release while armed**: the tab unloads and stays in your tab bar.
- **Change your mind mid-hold**: slide off the button or press Escape before the hold completes and nothing happens.

Unloading respects everything the built-in Unload Tab does:

- Pages with unsaved state show their normal beforeunload prompt.
- Unloading the active tab first switches to a neighbor tab (or Firefox View when all tabs would be unloaded).
- Multi-selected tabs unload as a group.
- Already-unloaded tabs are never armed, so clicking their close button just closes them.

## Install

From the Sine settings page, search for **Hold X to Unload Tab** in the mod marketplace.

Or install manually by adding this repository URL in Sine, or by copying `zen-hold-x-to-unload.uc.mjs` and `preferences.json` into `chrome/sine-mods/zen-hold-x-to-unload/` inside your profile and registering the mod in `mods.json`.

## Settings

- **Hold duration**: 250 ms, 400 ms, or 600 ms (default). Found in Settings → Sine → Hold X to Unload Tab.

## Compatibility

- Zen Browser with the Sine mod loader.
- Plays well with mods that restyle unloaded tabs or change how tab selection lands after closing/unloading.

## License

[MIT](LICENSE)
