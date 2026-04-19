import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Config {
    WSL_DISTRO: string;
    WSL_USER: string;
    SSH_HOST: string;
    SSH_USER: string;
    LOCAL_PATH: string;
    LOCAL_PATH_WSL: string;
}

type ConnectionType = 'local' | 'wsl' | 'remote' | 'unknown';

async function loadConfig(context: vscode.ExtensionContext): Promise<Config> {
    const configPath = path.join(context.extensionPath, 'config.env');
    const raw = await fs.readFile(configPath, 'utf-8');
    const config: Record<string, string> = {};
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const idx = trimmed.indexOf('=');
        if (idx === -1) {
            continue;
        }
        config[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return config as unknown as Config;
}

function validateConfig(config: Record<string, string>): string[] {
    const required: (keyof Config)[] = [
        'WSL_DISTRO', 'WSL_USER', 'SSH_HOST', 'SSH_USER', 'LOCAL_PATH', 'LOCAL_PATH_WSL'
    ];
    return required.filter(key => !config[key]);
}

function detectConnection(): ConnectionType {
    const env = vscode.env.remoteName;
    if (!env) {
        return 'local';
    }
    if (env.startsWith('wsl')) {
        return 'wsl';
    }
    if (env.startsWith('ssh-remote')) {
        return 'remote';
    }
    return 'unknown';
}

function makeButton(text: string, command: string, priority: number): vscode.StatusBarItem {
    const btn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
    btn.text = text;
    btn.command = command;
    btn.show();
    return btn;
}

function applyActiveState(
    current: ConnectionType,
    btnLocal: vscode.StatusBarItem,
    btnWSL: vscode.StatusBarItem,
    btnRemote: vscode.StatusBarItem
): void {
    btnLocal.text = current === 'local' ? '$(check) Local' : 'Local';
    btnWSL.text = current === 'wsl' ? '$(check) WSL' : 'WSL';
    btnRemote.text = current === 'remote' ? '$(check) Remote' : 'Remote';

    btnLocal.backgroundColor = current === 'local'
        ? new vscode.ThemeColor('statusBarItem.prominentBackground')
        : undefined;
    btnWSL.backgroundColor = current === 'wsl'
        ? new vscode.ThemeColor('statusBarItem.prominentBackground')
        : undefined;
    btnRemote.backgroundColor = current === 'remote'
        ? new vscode.ThemeColor('statusBarItem.prominentBackground')
        : undefined;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    let config: Config;
    try {
        config = await loadConfig(context);
    } catch {
        vscode.window.showErrorMessage('connection-swap: config.env not found or unreadable.');
        return;
    }

    const missing = validateConfig(config as unknown as Record<string, string>);
    if (missing.length > 0) {
        vscode.window.showErrorMessage(`connection-swap: missing config keys: ${missing.join(', ')}`);
        return;
    }

    const btnLocal = makeButton('Local', 'cswp.goLocal', 103);
    const btnWSL = makeButton('WSL', 'cswp.goWSL', 102);
    const btnRemote = makeButton('Remote', 'cswp.goRemote', 101);

    applyActiveState(detectConnection(), btnLocal, btnWSL, btnRemote);

    const cmdLocal = vscode.commands.registerCommand('cswp.goLocal', () => {
        vscode.commands.executeCommand('workbench.action.remote.close');
    });

    const cmdWSL = vscode.commands.registerCommand('cswp.goWSL', () => {
        const uri = vscode.Uri.parse(`vscode-remote://wsl+${config.WSL_DISTRO}/home/${config.WSL_USER}`);
        vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
    });

    const cmdRemote = vscode.commands.registerCommand('cswp.goRemote', () => {
        const uri = vscode.Uri.parse(`vscode-remote://ssh-remote+${config.SSH_HOST}/home/${config.SSH_USER}`);
        vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
    });

    context.subscriptions.push(btnLocal, btnWSL, btnRemote, cmdLocal, cmdWSL, cmdRemote);
}

export function deactivate(): void {}
