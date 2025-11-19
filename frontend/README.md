# Frontend Application

A modern React application built with Vite, ready to be deployed on AWS S3 + CloudFront. This frontend is designed to connect with the backend API and serve as the interface for an HR platform.

## 🚀 Features

- **React 18**: Modern React with hooks
- **Vite**: Lightning-fast build tool
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/       # Reusable components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Loading.tsx
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   └── NotFound.tsx
│   ├── services/        # API services
│   │   └── api.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🛠️ Local Development

### Prerequisites

- Node.js >= 18.x
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set environment variables**
   Create `.env.local`:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:5173

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# The build output will be in the 'dist' directory
```

## ☁️ AWS Deployment

### Deploy to S3

After Terraform infrastructure is deployed:

```bash
# Build the application
npm run build

# Sync to S3
aws s3 sync dist/ s3://YOUR-BUCKET-NAME/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

### Automated Deployment

The GitHub Actions workflow automatically deploys to S3 on push to main branch.

## 🔧 Configuration

### Environment Variables

Create `.env.production` for production:

```bash
VITE_API_URL=https://your-alb-domain.amazonaws.com
```

### API Integration

The frontend connects to the backend API. Update `src/services/api.ts` with your API endpoint.

## 🎨 Styling

This project uses Tailwind CSS for styling. Customize the theme in `tailwind.config.js`.

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🧪 Testing

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

## 🔒 Security

- Environment variables are prefixed with `VITE_` for safe exposure
- API calls use HTTPS in production
- CORS configured on backend
- CloudFront provides DDoS protection

## 🚀 Performance

- Code splitting with React.lazy
- CloudFront CDN for fast global delivery
- Optimized build with Vite
- Compressed assets (gzip/brotli)

## 📈 Monitoring

- CloudFront metrics in AWS CloudWatch
- User analytics can be added (Google Analytics, etc.)
- Error tracking can be added (Sentry, etc.)

## 🔄 Future Features (HR Platform)

- Employee dashboard
- User authentication
- Role-based access control
- Document management
- Performance reviews interface
- Time tracking
- Reports and analytics



