// Módulo de lanzamiento para el ejecutable empaquetado con pkg.
// Importado por server.js solo cuando process.pkg === true.
// Abre el navegador y muestra el ícono de bandeja del sistema.

import fs           from 'fs';
import os           from 'os';
import path         from 'path';
import { spawn }    from 'child_process';

const LOG = path.join(os.tmpdir(), 'sqla-error.log');

function logError(err) {
  try { fs.writeFileSync(LOG, `${new Date().toISOString()}\n${err?.stack || err}\n`); }
  catch (_) { /* nada que hacer */ }
}

export function initLauncher(PORT) {
  try {
    // ── Abrir el navegador ─────────────────────────────────────────────────
    spawn('cmd.exe', ['/c', 'start', '', `http://localhost:${PORT}`], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    // ── Bandeja del sistema vía PowerShell/.NET ────────────────────────────
    const trayScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon    = [System.Drawing.SystemIcons]::Application
$tray.Text    = "SQLa — Servidor activo en localhost:${PORT}"
$tray.Visible = $true

$tray.BalloonTipTitle = "SQLa iniciado"
$tray.BalloonTipText  = "Servidor corriendo en http://localhost:${PORT}"
$tray.BalloonTipIcon  = [System.Windows.Forms.ToolTipIcon]::Info
$tray.ShowBalloonTip(4000)

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$itemTitle = New-Object System.Windows.Forms.ToolStripMenuItem("SQLa v1.0.0")
$itemTitle.Enabled = $false
$menu.Items.Add($itemTitle) | Out-Null
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemOpen = New-Object System.Windows.Forms.ToolStripMenuItem("Abrir en navegador")
$itemOpen.Add_Click({ Start-Process "http://localhost:${PORT}" })
$menu.Items.Add($itemOpen) | Out-Null
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemExit = New-Object System.Windows.Forms.ToolStripMenuItem("Salir")
$itemExit.Add_Click({
    $tray.Visible = $false
    [Console]::Out.WriteLine("EXIT")
    [Console]::Out.Flush()
    [System.Windows.Forms.Application]::Exit()
})
$menu.Items.Add($itemExit) | Out-Null

$tray.ContextMenuStrip = $menu
$tray.Add_DoubleClick({ Start-Process "http://localhost:${PORT}" })

[System.Windows.Forms.Application]::Run()
`;

    const tmpDir     = path.join(os.tmpdir(), 'sqla-tray');
    const scriptPath = path.join(tmpDir, 'tray.ps1');
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(scriptPath, trayScript, 'utf8');

    const trayProc = spawn(
      'powershell',
      ['-NonInteractive', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );

    trayProc.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('EXIT')) {
        trayProc.kill();
        process.exit(0);
      }
    });

    trayProc.on('exit', () => process.exit(0));

  } catch (err) {
    logError(err);
  }
}
