$content = Get-Content 'c:\Users\Rendra Aji Syaputra\Downloads\bc_sumbing\src\features\profile\ProfilePage.tsx' -Raw
$lines = $content -split "`n"
$before = ($lines[0..937] -join "`n")
$replacement = Get-Content 'c:\Users\Rendra Aji Syaputra\Downloads\bc_sumbing\scratch\new-segmentation-ui.tsx' -Raw
$after = ($lines[1380..($lines.Count-1)] -join "`n")
$result = $before + "`n" + $replacement + "`n" + $after
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText('c:\Users\Rendra Aji Syaputra\Downloads\bc_sumbing\src\features\profile\ProfilePage.tsx', $result, $utf8NoBom)
Write-Output "Done. Lines replaced."
