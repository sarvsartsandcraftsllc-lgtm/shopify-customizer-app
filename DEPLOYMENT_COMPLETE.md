# 🚀 PRNTONDEMAND Complete Deployment Guide

This comprehensive guide covers deploying your Shopify print-on-demand app with all features including the Customizer component, Supabase integration, and webhook handling.

## ✨ **What We've Built**

### 🎨 **Customizer Component**
- **Fabric.js Canvas**: 12x14 inch @ 300 DPI printable area
- **Image Upload**: PNG/JPG/SVG support with 30MB limit
- **Text Controls**: Font, size, and color customization
- **Object Manipulation**: Drag, resize, rotate within bounds
- **Export Functions**: Preview (1000px) and Print (300 DPI) PNGs
- **Live Preview**: Real-time customization on product mockup

### 🔌 **Theme App Extension**
- **Customizer Block**: Injects `<div id="customizer-root"></div>` on product pages
- **Multiple Positioning**: Inline, sidebar, modal, overlay, fixed, sticky
- **Responsive Design**: Mobile-first approach with breakpoint system
- **Event System**: Comprehensive communication with your app

### ☁️ **Supabase Integration**
- **File Storage**: Prints and previews buckets
- **Database**: Design orders tracking with PostgreSQL
- **Signed URLs**: Secure file uploads with validation
- **Real-time Updates**: Live data synchronization

### 🛒 **Cart Integration**
- **Design Properties**: Automatically adds to line items
- **Property Display**: Shows in cart and checkout
- **Webhook Processing**: Orders automatically tracked in Supabase

### 👨‍💼 **Admin Dashboard**
- **Design Management**: View all pending designs
- **Status Updates**: Mark as printed/fulfilled
- **File Downloads**: Access to print files
- **Order Tracking**: Complete workflow management

## 🚀 **Deployment Steps**

### 1. **Supabase Setup**

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and API keys

#### Database Setup
1. **Run Schema**: Execute `supabase/schema.sql` in your Supabase SQL editor
2. **Storage Buckets**: Verify `prints` bucket is created
3. **Policies**: Ensure RLS policies are active

#### Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. **Shopify App Configuration**

#### App Settings
1. Go to [Shopify Partners](https://partners.shopify.com)
2. Navigate to your app
3. Update App URL to your Vercel domain
4. Add allowed redirection URLs

#### Webhook Setup
1. **Create Webhook**:
   - Topic: `orders/create`
   - URL: `https://your-app.vercel.app/api/webhooks/orders`
   - Format: JSON
   - Version: Latest

2. **Get Webhook Secret**:
   - Copy the webhook secret
   - Add to environment variables: `SHOPIFY_WEBHOOK_SECRET`

#### App Scopes
Ensure your app has these scopes:
```
read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_themes,write_themes
```

### 3. **Vercel Deployment**

#### Environment Variables
Set these in your Vercel project:
```bash
SHOPIFY_API_KEY=@shopify_api_key
SHOPIFY_API_SECRET=@shopify_api_secret
SHOPIFY_APP_URL=@shopify_app_url
SHOPIFY_APP_NAME=@shopify_app_name
SHOPIFY_WEBHOOK_SECRET=@shopify_webhook_secret
SUPABASE_URL=@supabase_url
SUPABASE_ANON_KEY=@supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=@supabase_service_role_key
DATABASE_URL=@database_url
NODE_ENV=production
```

#### Deploy Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. **Theme Extension Deployment**

#### Deploy Extension
```bash
# Navigate to app directory
cd prntondemand

# Deploy extension
npm run deploy
```

#### Add to Theme
1. Go to Shopify admin → Online Store → Themes
2. Click "Customize" on your active theme
3. Navigate to a product page
4. Add the "Customizer Block" section where desired

## 🔧 **Configuration Files**

### **vercel.json**
```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "build/client",
  "framework": "remix",
  "functions": {
    "app/routes/**/*.tsx": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### **Environment Variables**
```bash
# Copy template
cp env.template .env

# Edit with your values
nano .env
```

## 📱 **Testing Your Deployment**

### 1. **Customizer Component**
- Visit a product page with the Customizer Block
- Test image upload (PNG/JPG/SVG)
- Add text with different fonts/sizes/colors
- Drag, resize, and rotate objects
- Export preview and print files

### 2. **File Upload**
- Verify files upload to Supabase
- Check storage buckets for new files
- Confirm signed URLs work correctly

### 3. **Cart Integration**
- Complete a design
- Add to cart
- Verify design properties appear
- Check cart and checkout display

### 4. **Webhook Processing**
- Place a test order
- Check Supabase for new design order
- Verify webhook HMAC validation

### 5. **Admin Dashboard**
- Visit `/admin/designs`
- View pending designs
- Test status updates
- Download print files

## 🚨 **Troubleshooting**

### **Common Issues**

#### Customizer Not Loading
- Check browser console for errors
- Verify React component is available
- Check network tab for failed requests

#### File Upload Failures
- Verify Supabase credentials
- Check file size limits (30MB)
- Ensure PNG file type
- Verify storage bucket permissions

#### Webhook Errors
- Check HMAC verification
- Verify webhook secret
- Check webhook URL accessibility
- Review Supabase permissions

#### Cart Properties Missing
- Verify form submission
- Check line item properties
- Ensure design data is saved
- Review cart template

### **Debug Commands**
```bash
# Check environment variables
vercel env ls

# View function logs
vercel logs

# Test webhook locally
ngrok http 3000
```

## 🔒 **Security Considerations**

### **Webhook Security**
- HMAC verification enabled
- Webhook secret stored securely
- HTTPS-only endpoints

### **File Upload Security**
- File type validation (PNG only)
- Size limits enforced
- Signed URLs with expiration
- RLS policies active

### **API Security**
- Environment variables for secrets
- Shopify API authentication
- Supabase service role for admin operations

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**
- Enable in project dashboard
- Monitor function performance
- Track error rates

### **Supabase Monitoring**
- Database query performance
- Storage usage metrics
- Real-time connection status

### **Shopify Webhooks**
- Webhook delivery status
- Error logs and retries
- Performance metrics

## 🔄 **Continuous Deployment**

### **GitHub Actions**
```yaml
name: Deploy to Vercel
on:
  push:
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
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

### **Environment Variables in CI/CD**
- Store secrets in GitHub repository
- Use Vercel CLI for deployment
- Automated testing before deploy

## 📈 **Performance Optimization**

### **Build Optimization**
- Code splitting with Remix
- Tree shaking for unused code
- Image optimization
- CDN distribution

### **Runtime Optimization**
- Efficient canvas rendering
- Lazy loading of components
- Optimized file uploads
- Database query optimization

## 🎯 **Next Steps**

### **Immediate Actions**
1. ✅ Deploy to Vercel
2. ✅ Configure Supabase
3. ✅ Set up Shopify webhooks
4. ✅ Deploy theme extension
5. ✅ Test all functionality

### **Future Enhancements**
- Advanced design templates
- Bulk order processing
- Analytics dashboard
- Customer design library
- Integration with print services

### **Scaling Considerations**
- Database connection pooling
- File storage optimization
- CDN for static assets
- Load balancing for high traffic

---

## 🎉 **Congratulations!**

Your PRNTONDEMAND app is now fully deployed with:
- ✅ Professional customizer interface
- ✅ Secure file storage and management
- ✅ Complete order workflow
- ✅ Admin management dashboard
- ✅ Production-ready deployment

**Ready to start customizing! 🎨✨**







