# Fix navigation links in HTML files
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html"

foreach ($file in $htmlFiles) {
    Write-Host "Fixing file: $($file.Name)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Fix navigation links
    $content = $content -replace 'href="/encyclopedia"', 'href="/encyclopedia.html"'
    $content = $content -replace 'href="/gallery"', 'href="/gallery.html"'
    $content = $content -replace 'href="/guide"', 'href="/guide.html"'
    $content = $content -replace 'href="/login"', 'href="/login.html"'
    $content = $content -replace 'href="/register"', 'href="/register.html"'
    $content = $content -replace 'href="/"', 'href="/index.html"'
    
    # Save the modified content
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "All HTML files have been fixed!"