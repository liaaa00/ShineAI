param(
  [string]$DestinationParent = (Join-Path $PSScriptRoot '..\..\ShineAI-Backups'),
  [switch]$IncludeUserData
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$destinationRoot = [IO.Path]::GetFullPath($DestinationParent)
if ($destinationRoot.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or $destinationRoot -eq $projectRoot) {
  throw 'Backup destination must be outside the development project.'
}
New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null
$destination = Join-Path $destinationRoot ('shineai-dev-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
if (Test-Path -LiteralPath $destination) { throw 'Backup destination already exists.' }
$excluded = @((Join-Path $projectRoot '.test-data'), (Join-Path $projectRoot 'out'))
if (-not $IncludeUserData) { $excluded += (Join-Path $projectRoot '.data') }
& robocopy $projectRoot $destination /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ /XD $excluded /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -ge 8) { throw 'Backup copy failed.' }
if (-not (Test-Path -LiteralPath (Join-Path $destination 'archive\official-1.0.6.asar'))) { throw 'Backup lacks the dependency recovery archive.' }
Write-Output ('Backup saved: ' + $destination)
