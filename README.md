<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" width="100" height="100" alt="AuthPilot Logo">
</p>

<h1 align="center">AuthPilot</h1>

<p align="center">
  <strong>🛡️ Enterprise-Grade Authentication & Authorization Platform</strong>
</p>

<p align="center">
  A modern, full-stack role-based access control (RBAC) system with multi-tenant organization support, project management, and comprehensive audit logging.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NestJS-10.0+-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/MongoDB-7.0+-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-7.0+-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure access tokens with automatic refresh mechanism
- **Google OAuth 2.0** - One-click social login integration
- **Password Encryption** - Industry-standard bcrypt hashing
- **Rate Limiting** - Built-in throttling protection against brute force attacks
- **Helmet Security** - HTTP header protection middleware

### 👥 Role-Based Access Control (RBAC)
- **Hierarchical Roles** - Admin, Manager, and User role levels
- **Granular Permissions** - 50+ fine-grained permission controls
- **Dynamic Role Assignment** - Create and customize roles on the fly
- **Permission Guards** - Route and component-level access control

### 🏢 Multi-Tenant Organizations
- **Organization Management** - Create and manage isolated workspaces
- **Tenant Context** - Automatic data isolation per organization
- **User Membership** - Flexible user-organization associations
- **Cross-Organization Support** - Super admin oversight capabilities

### 📊 Project & Task Management
- **Project Hierarchy** - Organize work within organizations
- **Task Tracking** - Full CRUD operations with status management
- **Team Assignment** - Assign tasks to team members
- **Progress Monitoring** - Track project completion status

### 📝 Audit & Compliance
- **Comprehensive Logging** - Track all user actions and changes
- **Audit Trail** - Who did what and when
- **Log Retention** - Configurable retention policies
- **Export Capabilities** - Download audit logs for compliance

### 🎨 Modern UI/UX
- **Dark/Light/System Themes** - Fully customizable appearance
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Real-time Notifications** - Toast notifications for user feedback
- **Intuitive Navigation** - Clean dashboard layouts

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS** | Progressive Node.js framework |
| **TypeScript** | Type-safe development |
| **MongoDB** | NoSQL database with Mongoose ODM |
| **Redis** | Session management & caching |
| **Passport.js** | Authentication middleware |
| **JWT** | Token-based auth |
| **Joi** | Request validation |
| **Helmet** | Security headers |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library with hooks |
| **TypeScript** | Type-safe components |
| **Vite** | Lightning-fast build tool |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |
| **Lucide Icons** | Beautiful icon set |

---

## 📁 Project Structure

```
AuthPilot/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # UI Components
│   │   │   ├── Auth/          # Authentication views
│   │   │   ├── Dashboard/     # Role-based dashboards
│   │   │   ├── Organizations/ # Organization management
│   │   │   ├── Projects/      # Project views
│   │   │   ├── Roles/         # Role management
│   │   │   ├── Tasks/         # Task management
│   │   │   └── Users/         # User management
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities & API client
│   │   ├── services/          # API service layer
│   │   ├── store/             # Zustand stores
│   │   └── types/             # TypeScript definitions
│   └── package.json
│
├── server/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── audit/             # Audit logging module
│   │   ├── organizations/     # Organizations module
│   │   ├── projects/          # Projects module
│   │   ├── roles/             # Roles & permissions module
│   │   ├── tasks/             # Tasks module
│   │   ├── users/             # Users module
│   │   └── filters/           # Exception filters
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 7.0 (local or Atlas)
- **Redis** >= 7.0 (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AuthPilot.git
   cd AuthPilot
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

#### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_CONNECTION=mongodb://localhost:27017/authpilot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT (Generate with: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Audit
AUDIT_LOG_RETENTION_DAYS=90
```

#### Frontend Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=AuthPilot
VITE_APP_VERSION=1.0.0
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

#### Production Build

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## 🔑 Permission System

AuthPilot implements a comprehensive permission system with the following categories:

| Category | Permissions |
|----------|-------------|
| **Users** | `user:create`, `user:read`, `user:update`, `user:delete`, `user:list` |
| **Roles** | `role:create`, `role:read`, `role:update`, `role:delete`, `role:list` |
| **Organizations** | `organization:create`, `organization:read`, `organization:update`, `organization:delete`, `organization:list`, `organization:manage_users` |
| **Projects** | `project:create`, `project:read`, `project:update`, `project:delete`, `project:list`, `project:manage_users` |
| **Tasks** | `task:create`, `task:read`, `task:update`, `task:delete`, `task:list`, `task:assign` |
| **Audit** | `audit:read`, `audit:list` |
| **Settings** | `settings:read`, `settings:update` |
| **Dashboards** | `dashboard:admin`, `dashboard:manager`, `dashboard:user` |

---

## 🌐 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login with email/password |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout and invalidate tokens |
| `GET` | `/auth/me` | Get current user profile |
| `GET` | `/auth/google` | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | Google OAuth callback |

### Resource Endpoints

| Resource | Base Endpoint | Available Methods |
|----------|---------------|-------------------|
| Users | `/users` | GET, POST, PATCH, DELETE |
| Roles | `/roles` | GET, POST, PATCH, DELETE |
| Organizations | `/organizations` | GET, POST, PATCH, DELETE |
| Projects | `/projects` | GET, POST, PATCH, DELETE |
| Tasks | `/tasks` | GET, POST, PATCH, DELETE |
| Audit Logs | `/audit` | GET |

---

## 🚢 Deployment

AuthPilot is designed for modern cloud deployment:

### Backend → Render
- Web Service with auto-deploy from Git
- MongoDB Atlas for database
- Upstash or Redis Cloud for caching

### Frontend → Vercel
- Automatic builds on push
- Edge network distribution
- Environment variable management

📖 See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## 📚 Additional Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete deployment guide |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification |
| [GOOGLE_OAUTH_QUICKSTART.md](./GOOGLE_OAUTH_QUICKSTART.md) | Google OAuth setup guide |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing instructions |
| [GUARD_USAGE_EXAMPLES.md](./client/GUARD_USAGE_EXAMPLES.md) | Frontend permission guards |
| [TENANT_CONTEXT_USAGE.md](./server/TENANT_CONTEXT_USAGE.md) | Multi-tenant implementation |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [React](https://react.dev/) - The library for web interfaces
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful open-source icons

---

<p align="center">
  Made with ❤️ by the AuthPilot Team
</p>

<p align="center">
  <a href="#authpilot">⬆ Back to Top</a>
</p>
