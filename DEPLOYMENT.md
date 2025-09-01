# PRNTONDEMAND Deployment Guide

This guide covers deploying your Shopify print-on-demand app to Vercel and configuring it for production use.

## 🚀 Vercel Deployment

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab Repository**: Your code should be in a Git repository
3. **Shopify Partners Account**: For app configuration
4. **PostgreSQL Database**: For production data storage

### Step 1: Prepare Your Repository

Ensure your repository contains:
- `vercel.json` configuration
- All source code
- Proper environment variables template
- Database migrations

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. **Import Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Project**:
   - **Framework Preset**: Remix
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `build/client`
   - **Install Command**: `npm install`

3. **Environment Variables**:
   Add the following environment variables:
   ```
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_APP_URL=https://your-app.vercel.app
   SHOPIFY_APP_NAME=PRNTONDEMAND
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=production
   SESSION_SECRET=your_session_secret
   ```

#### Option B: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add SHOPIFY_API_KEY
   vercel env add SHOPIFY_API_SECRET
   vercel env add SHOPIFY_APP_URL
   vercel env add DATABASE_URL
   vercel env add NODE_ENV
   vercel env add SESSION_SECRET
   ```

### Step 3: Configure Shopify App

1. **Update App URLs**:
   - Go to your Shopify Partners dashboard
   - Navigate to your app
   - Update the App URL to your Vercel domain
   - Add allowed redirection URLs

2. **App Scopes**:
   Ensure your app has the required scopes:
   ```
   read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_themes,write_themes
   ```

## 🗄️ Database Setup

### PostgreSQL on Vercel

1. **Create Database**:
   - Go to [vercel.com/stores](https://vercel.com/stores)
   - Create a new PostgreSQL database
   - Copy the connection string

2. **Run Migrations**:
   ```bash
   # Set DATABASE_URL in your environment
   export DATABASE_URL="your_postgresql_connection_string"
   
   # Run migrations
   npx prisma migrate deploy
   ```

### Alternative: External PostgreSQL

You can use external providers like:
- **Supabase**: [supabase.com](https://supabase.com)
- **Neon**: [neon.tech](https://neon.tech)
- **Railway**: [railway.app](https://railway.app)

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_APP_NAME=PRNTONDEMAND

# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# App Configuration
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret

# Optional: Analytics and Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### Security Considerations

1. **Session Secret**: Use a strong, random string
2. **API Keys**: Never commit to version control
3. **Database**: Use SSL connections in production
4. **HTTPS**: Vercel provides this automatically

## 📱 Theme App Extension Deployment

### Deploy Extension

1. **Build Extension**:
   ```bash
   npm run generate extension
   ```

2. **Deploy to Shopify**:
   ```bash
   npm run deploy
   ```

3. **Install in Store**:
   - Go to your Shopify store admin
   - Navigate to Online Store > Themes
   - Customize your theme
   - Add the "Product Customizer" block

## 🔍 Monitoring and Debugging

### Vercel Analytics

1. **Enable Analytics**:
   - Go to your project dashboard
   - Navigate to Analytics tab
   - Enable web analytics

2. **View Logs**:
   - Check Function Logs for server-side errors
   - Monitor build logs for deployment issues

### Error Tracking

Consider integrating error tracking services:
- **Sentry**: For error monitoring
- **LogRocket**: For session replay
- **Vercel Analytics**: Built-in performance monitoring

## 🚀 Performance Optimization

### Build Optimization

1. **Code Splitting**: Remix handles this automatically
2. **Image Optimization**: Use Vercel's image optimization
3. **Caching**: Implement proper cache headers
4. **CDN**: Vercel provides global CDN

### Database Optimization

1. **Connection Pooling**: Configure Prisma connection limits
2. **Indexes**: Add database indexes for common queries
3. **Query Optimization**: Use Prisma's query optimization features

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run type-check
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Environment Variables in CI/CD

Set these secrets in your GitHub repository:
- `VERCEL_TOKEN`: Your Vercel API token
- `ORG_ID`: Your Vercel organization ID
- `PROJECT_ID`: Your Vercel project ID

## 🧪 Testing Before Production

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] Linting passes
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Shopify app configured
- [ ] Theme extension deployed
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable

### Testing Checklist

- [ ] App loads correctly
- [ ] Authentication works
- [ ] Database connections successful
- [ ] API endpoints respond
- [ ] Theme extension functions
- [ ] Error handling works
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure SSL is enabled

3. **Shopify Authentication Errors**:
   - Verify API keys are correct
   - Check app URL configuration
   - Ensure scopes are properly set

4. **Performance Issues**:
   - Monitor Vercel function execution time
   - Check database query performance
   - Optimize image sizes

### Getting Help

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Shopify Dev Docs**: [shopify.dev](https://shopify.dev)
- **Remix Documentation**: [remix.run/docs](https://remix.run/docs)
- **GitHub Issues**: Open an issue in your repository

## 📈 Post-Deployment

### Monitoring

1. **Set up alerts** for:
   - Error rates
   - Response times
   - Database connection issues
   - Shopify API rate limits

2. **Regular health checks**:
   - Monitor app performance
   - Check database health
   - Verify Shopify integration

### Maintenance

1. **Regular updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Update Shopify app scopes as needed

2. **Backup strategy**:
   - Database backups
   - Configuration backups
   - Code repository backups

---

**Happy Deploying! 🚀**



