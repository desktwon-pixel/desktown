$source = "C:\DESKTOWN\Onedesk\Onedesk"
$destination = "C:\DESKTOWN\Onedesk\Onedesk\onedesk_project.zip"
$tempDir = "C:\DESKTOWN\Onedesk\Onedesk\temp_zip_folder"

# Clean up previous artifacts
if (Test-Path $destination) { Remove-Item $destination -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

# Create temp directory
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Copying files to temporary folder..."

$excludeDirs = @("node_modules", ".git", "dist", ".vercel", "temp_zip_folder")
$excludeFiles = @("onedesk_project.zip", "create_zip.ps1", ".env")

# Get all files and folders recursively
$items = Get-ChildItem -Path $source -Recurse

foreach ($item in $items) {
    # Check if item is in an excluded directory
    $relPath = $item.FullName.Substring($source.Length + 1)
    $firstDir = $relPath.Split('\')[0]
    
    if ($excludeDirs -contains $firstDir) {
        continue
    }

    if ($item.PSIsContainer) {
        # Create directory in temp
        $destPath = Join-Path $tempDir $relPath
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath | Out-Null
        }
    } else {
        # Copy file
        if ($excludeFiles -contains $item.Name) {
            continue
        }
        $destPath = Join-Path $tempDir $relPath
        Copy-Item -Path $item.FullName -Destination $destPath
    }
}

Write-Host "Compressing files..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $destination

Write-Host "Cleaning up..."
Remove-Item $tempDir -Recurse -Force

Write-Host "ZIP file created successfully at: $destination"
