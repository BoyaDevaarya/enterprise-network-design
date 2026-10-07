$files = Get-ChildItem -Path "c:\Users\darsh\enterprise-network-design\client\src" -Recurse | Where-Object { $_.Extension -eq '.jsx' -or $_.Extension -eq '.css' }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $newContent = $content -replace 'glass-panel', 'surface-panel' `
                           -replace 'rounded-xl', 'rounded-sm' `
                           -replace 'rounded-lg', 'rounded-sm' `
                           -replace 'rounded-2xl', 'rounded-sm' `
                           -replace 'cyan-500', 'blue-600' `
                           -replace 'cyan-400', 'blue-500' `
                           -replace 'cyan-300', 'blue-400' `
                           -replace 'slate-900', 'zinc-900' `
                           -replace 'slate-800', 'zinc-800' `
                           -replace 'slate-700', 'zinc-700' `
                           -replace 'slate-500', 'zinc-500' `
                           -replace 'slate-400', 'zinc-400' `
                           -replace 'slate-300', 'zinc-300' `
                           -replace 'slate-200', 'zinc-200' `
                           -replace 'slate-100', 'zinc-100' `
                           -replace 'slate-950', 'zinc-950' `
                           -replace 'shadow-glowCyan', 'shadow-sm border-blue-500/50' `
                           -replace 'shadow-glowRose', 'shadow-sm border-red-500/50' `
                           -replace 'shadow-glowAmber', 'shadow-sm border-amber-500/50'
    if ($content -cne $newContent) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent)
        Write-Host "Updated $($file.FullName)"
    }
}
