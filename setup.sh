#!/bin/bash

# Project Migration Setup Script
# This script initializes the Laravel backend and Vue 3 frontend

echo "🚀 Starting Project Migration Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if required tools are installed
echo "Checking required tools..."

command -v php >/dev/null 2>&1 || { print_error "PHP is required but not installed. Aborting."; exit 1; }
command -v composer >/dev/null 2>&1 || { print_error "Composer is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }

print_success "All required tools are installed"
echo ""

# =================
# BACKEND SETUP
# =================
echo "📦 Setting up Laravel Backend..."
echo ""

if [ ! -d "backend" ]; then
    print_info "Creating Laravel project..."
    composer create-project laravel/laravel backend
    cd backend
    
    print_info "Installing Laravel Sanctum..."
    composer require laravel/sanctum
    
    print_info "Publishing Sanctum configuration..."
    php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
    
    print_success "Laravel backend created successfully"
else
    print_info "Backend directory already exists, skipping Laravel installation"
    cd backend
fi

# Generate application key if not set
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    print_info "Generating application key..."
    php artisan key:generate
fi

# Create necessary directories
print_info "Creating backend directory structure..."
mkdir -p app/Services
mkdir -p app/Http/Requests
mkdir -p database/seeders

print_success "Backend setup complete"
cd ..
echo ""

# =================
# FRONTEND SETUP
# =================
echo "🎨 Setting up Vue 3 Frontend..."
echo ""

if [ ! -d "frontend" ]; then
    print_info "Creating Vue 3 + TypeScript project..."
    npm create vite@latest frontend -- --template vue-ts
    
    cd frontend
    
    print_info "Installing dependencies..."
    npm install
    
    print_info "Installing additional packages..."
    npm install vue-router@4 pinia axios dayjs @vueuse/core
    
    print_info "Installing Tailwind CSS..."
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    
    print_info "Installing dev dependencies..."
    npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-vue
    
    print_success "Frontend dependencies installed"
    
    # Create directory structure
    print_info "Creating frontend directory structure..."
    mkdir -p src/components
    mkdir -p src/composables
    mkdir -p src/views
    mkdir -p src/stores
    mkdir -p src/services
    mkdir -p src/types
    mkdir -p src/utils
    mkdir -p src/router
    mkdir -p src/assets/styles
    
    print_success "Frontend setup complete"
    cd ..
else
    print_info "Frontend directory already exists, installing dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""

# =================
# CONFIGURATION FILES
# =================
echo "⚙️  Creating configuration files..."
echo ""

# Create Tailwind config if it doesn't exist
if [ ! -f "frontend/tailwind.config.js" ]; then
    cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add your custom design tokens here
      colors: {},
      fontFamily: {},
      spacing: {},
    },
  },
  plugins: [],
}
EOF
    print_success "Created tailwind.config.js"
fi

# Create main CSS file if it doesn't exist
if [ ! -f "frontend/src/assets/styles/main.css" ]; then
    mkdir -p frontend/src/assets/styles
    cat > frontend/src/assets/styles/main.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom base styles here */
EOF
    print_success "Created main.css"
fi

# Create basic API service
if [ ! -f "frontend/src/services/api.ts" ]; then
    cat > frontend/src/services/api.ts << 'EOF'
import axios, { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default api
EOF
    print_success "Created api.ts service"
fi

# Create basic types file
if [ ! -f "frontend/src/types/models.ts" ]; then
    cat > frontend/src/types/models.ts << 'EOF'
// Base model interface
export interface Model {
  id: number
  created_at: string
  updated_at: string
}

// API Response interfaces
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

// Add your specific models here
EOF
    print_success "Created models.ts types"
fi

# Create environment file for frontend
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8000/api/v1
EOF
    print_success "Created frontend .env file"
fi

echo ""

# =================
# FINAL INSTRUCTIONS
# =================
echo "✅ Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Next Steps:"
echo ""
echo "1. Configure your database in backend/.env"
echo "   - Set DB_DATABASE, DB_USERNAME, DB_PASSWORD"
echo ""
echo "2. Run Laravel migrations:"
echo "   cd backend"
echo "   php artisan migrate"
echo ""
echo "3. Start the backend server:"
echo "   cd backend"
echo "   php artisan serve"
echo "   (runs on http://localhost:8000)"
echo ""
echo "4. Start the frontend dev server:"
echo "   cd frontend"
echo "   npm run dev"
echo "   (runs on http://localhost:5173)"
echo ""
echo "5. Follow the MIGRATION_CHECKLIST.md for step-by-step migration"
echo ""
print_success "Happy coding! 🚀"
echo ""
