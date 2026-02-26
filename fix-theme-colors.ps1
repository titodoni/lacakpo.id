# PowerShell script to fix theme colors
# Run this to bulk replace hardcoded colors with theme variables

Get-ChildItem -Path "app" -Recurse -Include "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace zinc colors with theme colors
    $content = $content -replace 'text-zinc-900', 'text-foreground'
    $content = $content -replace 'text-zinc-800', 'text-foreground'
    $content = $content -replace 'text-zinc-700', 'text-foreground'
    $content = $content -replace 'text-zinc-600', 'text-muted-foreground'
    $content = $content -replace 'text-zinc-500', 'text-muted-foreground'
    $content = $content -replace 'text-zinc-400', 'text-muted-foreground'
    $content = $content -replace 'bg-zinc-900', 'bg-foreground'
    $content = $content -replace 'bg-zinc-800', 'bg-foreground'
    $content = $content -replace 'bg-zinc-700', 'bg-muted'
    $content = $content -replace 'bg-zinc-600', 'bg-muted'
    $content = $content -replace 'bg-zinc-500', 'bg-muted'
    $content = $content -replace 'bg-zinc-400', 'bg-muted'
    $content = $content -replace 'bg-zinc-300', 'bg-muted'
    $content = $content -replace 'bg-zinc-200', 'bg-muted'
    $content = $content -replace 'bg-zinc-100', 'bg-muted'
    $content = $content -replace 'bg-zinc-50', 'bg-muted/50'
    $content = $content -replace 'border-zinc-900', 'border-border'
    $content = $content -replace 'border-zinc-800', 'border-border'
    $content = $content -replace 'border-zinc-700', 'border-border'
    $content = $content -replace 'border-zinc-600', 'border-border'
    $content = $content -replace 'border-zinc-500', 'border-border'
    $content = $content -replace 'border-zinc-400', 'border-border'
    $content = $content -replace 'border-zinc-300', 'border-border'
    $content = $content -replace 'border-zinc-200', 'border-border'
    $content = $content -replace 'border-zinc-100', 'border-border'
    
    # Replace gray colors
    $content = $content -replace 'text-gray-900', 'text-foreground'
    $content = $content -replace 'text-gray-600', 'text-muted-foreground'
    $content = $content -replace 'text-gray-500', 'text-muted-foreground'
    $content = $content -replace 'bg-gray-100', 'bg-muted'
    $content = $content -replace 'bg-gray-200', 'bg-muted'
    $content = $content -replace 'border-gray-300', 'border-border'
    $content = $content -replace 'border-gray-200', 'border-border'
    
    # Replace white backgrounds
    $content = $content -replace "backgroundColor: '#ffffff'", 'backgroundColor: "var(--card)"'
    $content = $content -replace "backgroundColor: 'white'", 'backgroundColor: "var(--card)"'
    $content = $content -replace 'bg-white', 'bg-card'
    
    Set-Content $_.FullName $content
}

Write-Host "Theme colors updated!"
