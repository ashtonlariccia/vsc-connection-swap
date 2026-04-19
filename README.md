# connection-swap

Status bar buttons to switch between Local, WSL, and SSH remote environments in VS Code.

The active environment is highlighted with a checkmark in the status bar.

## Configuration

Edit `config.env` in the extension directory:

```env
WSL_DISTRO=your-distro-name
WSL_USER=your-wsl-username

SSH_HOST=your-ssh-host
SSH_USER=your-ssh-username

LOCAL_PATH=C:\path\to\local\folder
LOCAL_PATH_WSL=/mnt/c/path/to/local/folder
```

## Commands

| Command | Action |
|---|---|
| `connection-swap: Switch to Local` | Close remote connection |
| `connection-swap: Switch to WSL` | Open WSL remote session |
| `connection-swap: Switch to Remote` | Open SSH remote session |
