# Installs the Rust toolchain via rustup.
# Run this before any platform-specific setup script.

$ErrorActionPreference = "Stop"

if (Get-Command cargo -ErrorAction SilentlyContinue) {
    Write-Output "rustup already installed: $(rustup --version)"
    exit 0
}

$cargoHome = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { "$env:USERPROFILE\.cargo" }
$rustupExe = "$cargoHome\bin\rustup.exe"

if (-not (Test-Path $rustupExe)) {
    Write-Output "Installing rustup..."
    $installer = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile $installer
    & $installer -y --default-toolchain stable
    Remove-Item -Force $installer
}

$env:PATH = "$cargoHome\bin;$env:PATH"
Write-Output "Rust installed: $(& rustc --version)"
