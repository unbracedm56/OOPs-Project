# Quick Deployment Script
# Run this script to deploy to Vercel

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan

# Check if build works
Write-Host "`n📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "`n🔍 Checking for Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Installing globally..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host "Follow the prompts to:" -ForegroundColor White
Write-Host "  1. Login to Vercel (if not already)" -ForegroundColor White
Write-Host "  2. Link to existing project or create new one" -ForegroundColor White
Write-Host "  3. Confirm deployment" -ForegroundColor White
Write-Host ""

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your website is now live!" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Add environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "  2. Update Supabase redirect URLs" -ForegroundColor White
    Write-Host "  3. Test your deployed site" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the errors above and try again." -ForegroundColor Yellow
}
