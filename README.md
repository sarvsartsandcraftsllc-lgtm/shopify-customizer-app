# PRNTONDEMAND - Shopify Print-on-Demand App

A comprehensive Shopify embedded app built with Node.js, TypeScript, and Remix for managing print-on-demand products and customizations.

## 🚀 Features

- **Admin Dashboard**: Complete management interface for print-on-demand operations
- **Product Management**: Create and manage custom print products
- **Order Tracking**: Monitor orders and fulfillment status
- **Print Job Management**: Track print production queue
- **Customer Management**: View customer information and order history
- **Theme App Extension**: Customer-facing product customizer
- **Vercel Deployment Ready**: Optimized for cloud deployment

## 🛠️ Tech Stack

- **Frontend**: Remix + React + TypeScript
- **UI Components**: Shopify Polaris Design System
- **Backend**: Node.js + Remix
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Shopify App Bridge
- **Deployment**: Vercel
- **Code Quality**: ESLint + Prettier

## 📋 Prerequisites

- Node.js 18.20+ or 20.10+ or 21.0+
- Git
- Shopify Partners account
- PostgreSQL database (for production)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd prntondemand
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.template .env
```

Edit `.env` with your Shopify app credentials:

```env
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_APP_URL=https://your-app-domain.vercel.app
SHOPIFY_APP_NAME=PRNTONDEMAND
DATABASE_URL="postgresql://username:password@localhost:5432/prntondemand"
NODE_ENV=development
SESSION_SECRET=your_session_secret_here
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma generate

# Run database migrations
npm run prisma migrate dev
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
prntondemand/
├── app/                          # Main application code
│   ├── routes/                   # Remix routes
│   ├── db.server.ts             # Database configuration
│   ├── shopify.server.ts        # Shopify authentication
│   └── root.tsx                 # Root component
├── extensions/                   # Shopify app extensions
│   └── theme-app-extension/     # Theme app extension
│       ├── shopify.theme.extension.toml
│       └── blocks/              # Liquid blocks
├── prisma/                      # Database schema and migrations
├── public/                      # Static assets
├── vercel.json                  # Vercel deployment config
├── .eslintrc.cjs               # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── package.json                # Dependencies and scripts
```

## 🎨 Admin Dashboard

The admin dashboard includes:

- **Dashboard**: Overview with stats and recent activity
- **Products**: Manage print-on-demand products
- **Orders**: Track order fulfillment
- **Print Jobs**: Monitor production queue
- **Customers**: Customer management
- **Settings**: App configuration

## 🎯 Theme App Extension

The theme app extension provides:

- **Product Customizer**: Customer-facing customization interface
- **Color Selection**: Choose product colors
- **Text Input**: Add custom text
- **Image Upload**: Upload custom images
- **Live Preview**: Real-time customization preview
- **Responsive Design**: Mobile-friendly interface

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add SHOPIFY_API_KEY
   vercel env add SHOPIFY_API_SECRET
   vercel env add SHOPIFY_APP_URL
   vercel env add DATABASE_URL
   ```

### Environment Variables for Production

- `SHOPIFY_API_KEY`: Your Shopify app API key
- `SHOPIFY_API_SECRET`: Your Shopify app API secret
- `SHOPIFY_APP_URL`: Your deployed app URL
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production"

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Code Quality

- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Type safety and IntelliSense

### Adding New Features

1. **Create new routes** in `app/routes/`
2. **Add database models** in `prisma/schema.prisma`
3. **Create new extensions** in `extensions/`
4. **Update types** in `app/types/`

## 📱 Shopify App Configuration

### Required App Scopes

```env
SHOPIFY_APP_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_themes,write_themes
```

### App URLs

- **App URL**: `https://your-app-domain.vercel.app`
- **Allowed redirection URLs**: `https://your-app-domain.vercel.app/auth/callback`

## 🔒 Security Features

- **Helmet**: Security headers
- **Compression**: Response compression
- **Environment Variables**: Secure configuration
- **Shopify Authentication**: OAuth 2.0 flow

## 📊 Database Schema

The app uses Prisma with the following main models:

- **Sessions**: User authentication sessions
- **Products**: Print-on-demand products
- **Orders**: Customer orders
- **PrintJobs**: Print production jobs
- **Customers**: Customer information

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📈 Monitoring and Analytics

- **Error Tracking**: Built-in error boundaries
- **Performance**: Remix performance optimizations
- **Logging**: Structured logging for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the [Shopify Dev Docs](https://shopify.dev)
- Review [Remix Documentation](https://remix.run/docs)
- Open an issue in this repository

## 🔄 Updates

Keep your app updated:

```bash
npm update
npm run prisma generate
npm run build
```

---

**Built with ❤️ for the Shopify ecosystem**
