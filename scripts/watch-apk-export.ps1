<#
.SYNOPSIS
Watches Android APK output. Every exported APK bumps the patch version and
pushes a [apk-export] commit to main, which triggers the GitHub Actions
workflow to build a clean APK and publish it as a GitHub Release.

.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/watch-apk-export.ps1
#>
param(
  [switch]$Once,
  [int]$PollSeconds = 5
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$apkDir = Join-Path $root 'android/app/build/outputs/apk'
$bumpScript = Join-Path $root 'scripts/bump-version.mjs'
$versionFiles = @(
  'android/app/build.gradle',
  'package.json',
  'package-lock.json',
  'src/context/LanguageContext.tsx',
  'src/services/appUpdate.ts',
  'fdroid/com.videshkarmakar.whatsapp.yml'
)

function Get-LatestApk {
  if (-not (Test-Path -LiteralPath $apkDir)) { return $null }
  return Get-ChildItem -LiteralPath $apkDir -Filter '*.apk' -Recurse -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
}

function Get-NextVersion {
  $gradle = Get-Content -Raw -LiteralPath (Join-Path $root 'android/app/build.gradle')
  if ($gradle -match 'versionName\s+"(\d+)\.(\d+)\.(\d+)(?:\.\d+)?"') {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    $patch = [int]$Matches[3]
    return "$major.$minor.$($patch + 1)"
  }
  return '1.0.1'
}

function Export-Release {
  param([System.IO.FileInfo]$Apk)

  $version = Get-NextVersion
  Write-Host "[APK export] $($Apk.Name) -> v$version"

  & node $bumpScript $version
  if ($LASTEXITCODE -ne 0) { throw 'Version bump failed' }

  git add -- $versionFiles
  if (git diff --cached --quiet) {
    Write-Host '[APK export] no version changes to push'
    return
  }

  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  git commit -m "chore: APK export v$version [apk-export]"
  if ($LASTEXITCODE -ne 0) { throw 'Version commit failed' }

  # GitHub Actions may have pushed a bump commit in the meantime.
  git fetch origin $branch
  if ($LASTEXITCODE -eq 0 -and [int](git rev-list --count "HEAD..origin/$branch") -gt 0) {
    git rebase "origin/$branch"
    if ($LASTEXITCODE -ne 0) {
      Write-Warning '[APK export] rebase failed - resolve manually and push'
      return
    }
  }

  git push origin "HEAD:$branch"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning '[APK export] push failed - resolve git state and push manually'
    return
  }
  Write-Host "[APK export] pushed v$version - GitHub Actions will publish the release."
}

$last = Get-LatestApk
if ($Once) { $last = $null }

Write-Host "[APK export] watching $apkDir (Ctrl+C to stop)"
while ($true) {
  Start-Sleep -Seconds $PollSeconds

  $current = Get-LatestApk
  if (-not $current) { continue }

  $unchanged = $last -and
    $current.FullName -eq $last.FullName -and
    $current.LastWriteTimeUtc -le $last.LastWriteTimeUtc
  if ($unchanged) { continue }

  # Let a multi-ABI build finish writing all of its APKs.
  Start-Sleep -Seconds 15
  $settled = Get-LatestApk
  if (-not $settled) { continue }

  Export-Release -Apk $settled
  $last = $settled
  if ($Once) { break }
}
