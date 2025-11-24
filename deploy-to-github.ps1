# Initialize Git Repository and Push to GitHub

Write-Host "🚀 Initializing Git Repository..." -ForegroundColor Cyan

# Initialize git
git init

# Add all files
Write-Host "📦 Adding files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Committing..." -ForegroundColor Yellow
git commit -m "Initial commit - Petizo Pet Management System"

# Get GitHub username and repo name
Write-Host "`n📝 Please enter your GitHub details:" -ForegroundColor Green
$username = Read-Host "GitHub Username"
$reponame = Read-Host "Repository Name (e.g., petizo)"

# Add remote
Write-Host "`n🔗 Adding remote..." -ForegroundColor Yellow
git branch -M main
git remote add origin "https://github.com/$username/$reponame.git"

# Push
Write-Host "`n⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n✅ Done! Your code is now on GitHub" -ForegroundColor Green
Write-Host "🌐 Repository URL: https://github.com/$username/$reponame" -ForegroundColor Cyan
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://vercel.com/" -ForegroundColor White
Write-Host "2. Import your GitHub repository" -ForegroundColor White
Write-Host "3. Deploy!" -ForegroundColor White
