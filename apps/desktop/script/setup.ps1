# Installs the native build tools GPUI needs to compile on Windows.
# Run script/setup-rust.ps1 first if you don't have Rust installed yet.

$ErrorActionPreference = "Stop"

function Check-VSBuildTools {
  $vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"

  if (-not (Test-Path $vswhere)) {
    return $false
  }

  $result = & $vswhere -latest -requires Microsoft.VisualStudio.Workload.NativeDesktop -property installationPath
  return $result -and $result.Trim().Length -gt 0
}

if (-not (Check-VSBuildTools)) {
  Write-Output ""
  Write-Output "Visual Studio Build Tools with 'Desktop development with C++' not found."
  Write-Output ""
  Write-Output "Install it from: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
  Write-Output "Check the 'Desktop development with C++' workload during setup, then re-run this script."
  Write-Output ""
  exit 1
}

Write-Output "Desktop native dependencies ready."
