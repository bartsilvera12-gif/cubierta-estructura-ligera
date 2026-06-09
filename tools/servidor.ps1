# Servidor estatico minimo en PowerShell.
# Sirve la carpeta del proyecto en http://127.0.0.1:5500
# Sin Node, sin dependencias.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 5500
$prefix = "http://127.0.0.1:$port/"

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.avif' = 'image/avif'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
} catch {
  Write-Host "ERROR al abrir el puerto $port. Probablemente ya esta en uso." -ForegroundColor Red
  Write-Host "  - Cierra otro servidor local que tengas en el puerto $port y vuelve a intentarlo."
  Read-Host "Pulsa ENTER para salir"
  exit 1
}

Write-Host ""
Write-Host "  Servidor NCG corriendo en:" -ForegroundColor Cyan
Write-Host "    $prefix" -ForegroundColor Yellow
Write-Host "    ${prefix}admin/login.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pulsa Ctrl+C para detener."
Write-Host ""

# Abrir el navegador en la pagina de login.
Start-Process "${prefix}admin/login.html"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { break }

  $req = $ctx.Request
  $res = $ctx.Response

  try {
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($rel -eq '/' -or $rel -eq '') { $rel = '/index.html' }

    $path = Join-Path $root $rel.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $path = [IO.Path]::GetFullPath($path)

    # Bloquear path traversal
    if (-not $path.StartsWith([IO.Path]::GetFullPath($root))) {
      $res.StatusCode = 403
      $res.OutputStream.Close()
      continue
    }

    if (Test-Path -LiteralPath $path -PathType Container) {
      $idx = Join-Path $path 'index.html'
      if (Test-Path -LiteralPath $idx) { $path = $idx }
    }

    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - $rel no encontrado")
      $res.OutputStream.Write($msg, 0, $msg.Length)
      $res.OutputStream.Close()
      continue
    }

    $ext = [IO.Path]::GetExtension($path).ToLower()
    $ct  = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }

    $bytes = [IO.File]::ReadAllBytes($path)
    $res.StatusCode = 200
    $res.ContentType = $ct
    $res.Headers.Add('Cache-Control','no-store')
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()
  } catch {
    try { $res.StatusCode = 500; $res.OutputStream.Close() } catch {}
  }
}

$listener.Stop()
