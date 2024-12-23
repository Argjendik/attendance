# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "Starting Heroku deployment..."

# Create Heroku apps if they don't exist
Write-Host "Creating Heroku apps..."
try { heroku apps:create attendance-system-api } catch { }
try { heroku apps:create attendance-system-web } catch { }

# Add PostgreSQL addon for the backend
Write-Host "Adding PostgreSQL addon..."
heroku addons:create heroku-postgresql:hobby-dev --app attendance-system-api

# Set environment variables for backend
Write-Host "Configuring backend environment..."
heroku config:set NODE_ENV=production --app attendance-system-api
heroku config:set JWT_SECRET=$env:JWT_SECRET --app attendance-system-api

# Deploy backend
Write-Host "Deploying backend..."
Set-Location -Path "backend"
git init
git add .
git commit -m "Deploy backend to Heroku"
heroku git:remote -a attendance-system-api
git push heroku master

# Deploy frontend
Write-Host "Deploying frontend..."
Set-Location -Path "../frontend"
git init
git add .
git commit -m "Deploy frontend to Heroku"
heroku git:remote -a attendance-system-web
# Set the API URL to point to the backend Heroku app
heroku config:set REACT_APP_API_URL=https://attendance-system-api.herokuapp.com --app attendance-system-web
git push heroku master

Write-Host "Deployment completed!"
Write-Host "Backend URL: https://attendance-system-api.herokuapp.com"
Write-Host "Frontend URL: https://attendance-system-web.herokuapp.com" 