# HOA Court Reservations - Project Structure

## 📁 **Root Directory Structure**

```
HOA-Court-Reservations/
├── 📁 docs/                          # Documentation files
├── 📁 database/                      # Database scripts and migrations
├── 📁 src/                           # Source code
├── 📁 static/                        # Static assets
├── 📁 scripts/                       # Utility scripts
├── 📁 node_modules/                  # Dependencies (auto-generated)
├── 📄 README.md                      # Main project documentation (root)
├── 📄 .env                           # Environment variables (local)
├── 📄 package.json                   # Project configuration
├── 📄 svelte.config.js              # Svelte configuration
├── 📄 vite.config.js                # Vite configuration
└── 📄 tsconfig.json                 # TypeScript configuration
```

## 📚 **Documentation (`docs/`)**

### **Setup and Configuration**
- `ENVIRONMENT_VARIABLES.md` - Environment configuration guide
- `SUPABASE_SETUP_GUIDE.md` - Database setup instructions
- `VERCEL_DEPLOYMENT_GUIDE.md` - Production deployment guide

**Note**: `README.md` is located in the project root for standard GitHub visibility.

### **Feature Documentation**
- `EMAIL_CONFIGURATION.md` - Email service setup and configuration
- `PASSWORD_MANAGEMENT_IMPLEMENTATION_SUMMARY.md` - Password reset system
- `MULTI_TENANT_HOA_IMPLEMENTATION_SUMMARY.md` - Multi-tenant architecture
- `RBAC_SYSTEM.md` - Role-based access control documentation
- `PHONE_NUMBER_INTEGRATION_SUMMARY.md` - Phone number handling

### **Technical Documentation**
- `POSTGRESQL_CONSTRAINT_FIX_SUMMARY.md` - Database constraint fixes
- `SVELTE_5_COMPATIBILITY_ASSESSMENT.md` - Svelte 5 upgrade notes
- `SETUP_COMPLETE.md` - Development setup verification
- `SUPABASE_KEYS_REFERENCE.md` - API keys and configuration reference

## 🗄️ **Database (`database/`)**

### **Core Setup**
- `database-setup.sql` - Main database schema and initial setup
- `database-fix-constraints.sql` - PostgreSQL constraint fixes
- `database-fix-foreign-keys.sql` - Foreign key relationship fixes
- `database-fix-rls-policies.sql` - Row Level Security policy fixes

### **Feature Migrations**
- `database-password-reset-migration.sql` - Password reset functionality
- `database-password-reset-fix.sql` - Password reset bug fixes
- `database-password-reset-final-fix.sql` - Final password reset improvements
- `database-address-fields-migration.sql` - User address fields
- `database-migration-add-phone.sql` - Phone number integration

## 💻 **Source Code (`src/`)**

### **Application Structure**
```
src/
├── 📁 lib/                           # Shared libraries and utilities
│   ├── 📁 components/                # Reusable UI components
│   ├── 📁 server/                    # Server-side utilities
│   ├── 📁 stores/                    # Svelte stores (state management)
│   └── 📁 utils/                     # Utility functions
├── 📁 routes/                        # SvelteKit routes (pages and API)
├── 📄 app.d.ts                       # TypeScript app definitions
├── 📄 app.html                       # HTML template
├── 📄 hooks.client.js                # Client-side hooks
├── 📄 hooks.server.js                # Server-side hooks
└── 📄 service-worker.js              # PWA service worker
```

### **Key Components**
- **Authentication**: Login, register, password reset pages
- **Dashboard**: User dashboard and admin interfaces
- **Booking System**: Court reservation functionality
- **Profile Management**: User profile and settings
- **Admin Tools**: HOA management and user administration

### **Server-Side Libraries**
- **Database**: Supabase client and utilities
- **Authentication**: User session management
- **Email**: Resend integration for notifications
- **RBAC**: Role-based access control system

## 🛠️ **Utility Scripts (`scripts/`)**

- `test-db.js` - Database connection and schema testing
- `test-full-workflow.js` - End-to-end workflow testing
- `test-rbac.js` - Role-based access control testing
- `bootstrap-system.js` - System initialization
- `debug-login.js` - Authentication debugging
- `simple-db-test.js` - Basic database connectivity test

## 🌐 **Static Assets (`static/`)**

```
static/
├── 📁 icons/                         # PWA icons and favicons
├── 📄 favicon.png                    # Browser favicon
└── 📄 manifest.json                  # PWA manifest
```

## 🔧 **Configuration Files**

### **Core Configuration**
- `package.json` - Dependencies, scripts, and project metadata
- `svelte.config.js` - Svelte and SvelteKit configuration
- `vite.config.js` - Vite build tool configuration
- `tsconfig.json` - TypeScript compiler configuration

### **Environment Configuration**
- `.env` - Local environment variables (not in version control)
- `.env.example` - Environment variable template

## 📋 **File Organization Principles**

### **Documentation**
- All `.md` files except `README.md` are organized in the `docs/` folder
- `README.md` remains in the project root for GitHub visibility
- Documentation is categorized by purpose (setup, features, technical)
- Cross-references use relative paths (`../database/file.sql`)

### **Database**
- All `.sql` files are organized in the `database/` folder
- Files are named with descriptive prefixes (`database-`, `migration-`)
- Setup scripts are separated from migration scripts

### **Source Code**
- Follows SvelteKit conventions for routing and structure
- Server-side code is separated from client-side code
- Reusable components and utilities are properly organized

### **Environment Variables**
- `.env` file remains in the project root for proper loading
- Environment-specific configurations are documented
- Sensitive data is never committed to version control

## 🔄 **Migration Guide**

### **For Existing Installations**
If you have an existing installation with files in the old locations:

1. **Move Documentation Files**:
   ```bash
   mkdir docs
   move *.md docs/
   ```

2. **Move Database Files**:
   ```bash
   mkdir database
   move *.sql database/
   ```

3. **Update References**:
   - Update any scripts or documentation that reference the old file paths
   - Use relative paths from the new locations

### **For New Installations**
- Follow the setup guides in the `docs/` folder
- Run database scripts from the `database/` folder
- All paths in documentation reflect the new structure

This organized structure makes the project more maintainable, easier to navigate, and follows standard conventions for documentation and database script organization.
