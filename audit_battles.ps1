Set-Location 'c:\Users\benni\Desktop\unicycling\ranking project'
Get-ChildItem -Path 'event results' -Filter '*.txt' | ForEach-Object {
  $text = Get-Content -Path $_.FullName -Raw
  if ($text -notmatch ';') {
    Write-Output "$($_.Name): NO SEMICOLON"
    return
  }

  $parts = $text -split ';'
  if ($parts.Length -lt 2) {
    Write-Output "$($_.Name): BAD SPLIT"
    return
  }

  $battles = $parts[1].Trim()
  if ([string]::IsNullOrWhiteSpace($battles)) {
    Write-Output "$($_.Name): NO BATTLE DATA"
    return
  }

  $lines = $battles -split "`r?`n" | Where-Object { $_.Trim() -ne '' }
  if ($lines.Count -eq 0) {
    Write-Output "$($_.Name): EMPTY BATTLE SECTION"
    return
  }

  $bad = @()
  foreach ($line in $lines) {
    if ($line -notmatch ',') {
      $bad += $line
      continue
    }
    $parts2 = $line -split ',', 2
    if ($parts2.Length -lt 2 -or [string]::IsNullOrWhiteSpace($parts2[0]) -or [string]::IsNullOrWhiteSpace($parts2[1])) {
      $bad += $line
    }
  }

  if ($bad.Count -gt 0) {
    Write-Output "$($_.Name): BAD BATTLE LINES"
  } else {
    Write-Output "$($_.Name): OK"
  }
}
