# doge-model

CLI tool to switch Doge model configs by swapping `~/.doge/settings.json` with a model-specific file.

## What it does

`doge-model` looks for files matching:

- `~/.doge/settings.json.<model-name>`

Then it can:

- Switch directly to a model: `doge-model <model-name>`
- Open an interactive selector (arrow keys + enter): `doge-model`

## Requirements

- [Bun](https://bun.sh/) (the CLI script uses a Bun shebang)

## Installation

From this project folder:

```bash
bun install
bun link
```

After linking, you can run:

```bash
doge-model
```

## Setup model files

Create one file per model in your Doge config directory:

```bash
~/.doge/settings.json.gpt-4
~/.doge/settings.json.deepseek
~/.doge/settings.json.claude
```

Each file should contain a complete valid JSON settings object.

## Usage

### Interactive mode

```bash
doge-model
```

- Use `↑` / `↓` to move
- Press `Enter` to switch
- Press `Ctrl+C` to cancel

### Direct switch

```bash
doge-model deepseek
```

This copies:

- from `~/.doge/settings.json.deepseek`
- to `~/.doge/settings.json`

## Notes

- If no model files exist, the CLI prints guidance and exits.
- If the named model does not exist, the CLI exits with an error.
- Current model detection is content-based: it compares the active `settings.json` file against each model file.

## License

MIT. See [LICENSE](LICENSE).
