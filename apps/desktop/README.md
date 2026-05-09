# Desktop

The native desktop app, built with [GPUI](https://gpui.rs).

## Getting started

**1. Install Rust:**

```bash
# Linux / macOS / WSL
./script/setup-rust
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\script\setup-rust.ps1
```

Both scripts skip installation if Rust is already present. On Linux/macOS/WSL only: after a fresh install, reload your shell with `source "$HOME/.cargo/env"`

**2. Install native dependencies:**

```bash
# Linux / macOS / WSL
./apps/desktop/script/setup
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\apps\desktop\script\setup.ps1
```

**3. Run:**

```bash
cargo run -p opencut-desktop
```

## Platform notes

**Linux:** supports apt (Debian/Ubuntu/Mint), dnf (Fedora/RHEL), and pacman (Arch).

**macOS:** installs Xcode Command Line Tools if missing.

**Windows:** the setup script checks for Visual Studio Build Tools. If missing, it prints the install link.

**WSL:** runs the same scripts as Linux. Window rendering works via WSLg on Windows 11 and Windows 10 22H2+. If you're on an older build, test on the host instead.
