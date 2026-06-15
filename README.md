# ☁️ CloudDeploy

> A mini Railway/Heroku-style PaaS built on Kubernetes.  
> Connect a GitHub repo → CloudDeploy builds, pushes, and deploys your app with a public URL, logs, monitoring, and auto-scaling.

```
GitHub Repository → One Click → Live Application
```

---

## 🏗️ Architecture

```
User Browser
     │
     ▼
React Dashboard (Vite + Tailwind)
     │
     ▼
Express REST API + Socket.io
     │
     ├──── MongoDB (users, projects, deployments, logs)
     ├──── Redis (BullMQ job queue)
     │
     ├──── GitHub Service (clone repos, handle webhooks)
     ├──── Docker Build Engine (dockerode → Docker daemon)
     ├──── Container Registry (Docker Hub / ECR)
     │
     └──── Kubernetes API (@kubernetes/client-node)
                │
                ├── Namespace per project
                ├── Deployment (rolling updates)
                ├── Service (ClusterIP)
                ├── Ingress (nginx + TLS)
                ├── ConfigMap (env vars)
                ├── Secret (sensitive vars)
                └── HPA (CPU/memory autoscaling)
```

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express.js + Socket.io |
| Database | MongoDB 7 + Mongoose |
| Job Queue | BullMQ + Redis |
| Containerization | Docker + dockerode |
| Orchestration | Kubernetes + @kubernetes/client-node |
| Registry | Docker Hub (pluggable: ECR, Harbor) |
| CI/CD | GitHub Webhooks + automated pipeline |
| Monitoring | Prometheus + Grafana |
| SSL | cert-manager + Let's Encrypt |
| Ingress | NGINX Ingress Controller |

---

## 📋 Prerequisites

- **Node.js** >= 20.x
- **Docker** (Desktop or Engine) — running
- **Git**
- **Kubernetes cluster** — one of:
  - [minikube](https://minikube.sigs.k8s.io/docs/start/) (local dev, recommended)
  - [kind](https://kind.sigs.k8s.io/)
  - EKS / GKE / AKS (production)
- **Helm** >= 3.x (for cluster setup)
- **kubectl** configured to point at your cluster

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/clouddeploy.git
cd clouddeploy

# Copy and fill in environment variables
cp .env.example .env
```

Edit `.env` with your values (see [Configuration](#-configuration) below).

### 2. Set Up Kubernetes (Minikube)

```bash
# Installs minikube cluster + ingress-nginx + cert-manager + Prometheus/Grafana
bash infra/scripts/setup-minikube.sh

# Add minikube IP to hosts file (run as admin on Windows)
# Replace <MINIKUBE_IP> with output from: minikube ip
echo "<MINIKUBE_IP>  app.clouddeploy.local" >> /etc/hosts
```

### 3. Start the Application

```bash
# Start MongoDB, Redis, Backend, Frontend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Optional: start dev tools (Mongo Express + Redis Commander)
docker-compose --profile tools up -d
```

### 4. Open the Dashboard

| Service | URL |
|---|---|
| Frontend Dashboard | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Health | http://localhost:5000/api/health |
| Mongo Express | http://localhost:8081 |
| Redis Commander | http://localhost:8082 |

### 5. Register & Deploy

1. Go to http://localhost:3000/register
2. Create an account
3. Click **New Project**
4. Paste a GitHub repo URL (must have a `Dockerfile`)
5. Click **Deploy** → watch the pipeline run in real-time!

---

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```env
# Required
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=<32+ char secret>
DOCKER_USERNAME=<your DockerHub username>
DOCKER_PASSWORD=<your DockerHub token>
GITHUB_WEBHOOK_SECRET=<random string>
BASE_DOMAIN=clouddeploy.local

# Optional (for email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=<gmail app password>
```

Full reference: [`.env.example`](.env.example)

---

## 🗂️ Project Structure

```
clouddeploy/
├── frontend/               # React + Vite + Tailwind dashboard
│   ├── src/
│   │   ├── components/     # UI components (LogViewer, PodStatusGrid, etc.)
│   │   ├── pages/          # Route pages (Dashboard, ProjectDetail, etc.)
│   │   ├── store/          # Zustand state stores
│   │   ├── services/       # API client + Socket.io client
│   │   └── hooks/          # Custom React hooks
│   └── ...
│
├── backend/                # Node.js + Express API
│   └── src/
│       ├── modules/        # Feature modules (auth, projects, docker, k8s, ...)
│       ├── models/         # Mongoose schemas
│       ├── middleware/     # Auth, error handler, rate limiter
│       ├── jobs/           # BullMQ deployment pipeline worker
│       ├── config/         # DB, Redis, K8s, env config
│       └── utils/          # Helpers (slug, encryption, response)
│
├── infra/
│   ├── k8s/templates/      # Per-project K8s YAML templates
│   ├── scripts/            # setup-minikube.sh, setup-cluster.sh
│   └── mongo/init.js       # MongoDB initialization + indexes
│
├── docker-compose.yml      # Local dev stack
├── .env.example            # Environment variable reference
└── README.md
```

---

## 🔄 Deployment Pipeline

Each deployment runs through this state machine:

```
queued → building → pushing → deploying → running
                                        ↘ failed
                                        ↘ stopped
```

1. **Queued** — Added to BullMQ job queue
2. **Building** — `git clone/pull` → `docker build -t image:v<n> .`
3. **Pushing** — `docker push <registry>/<user>/<project>:v<n>`
4. **Deploying** — Create/update K8s Namespace, Deployment, Service, Ingress, ConfigMap, Secret, HPA
5. **Running** — App live at `https://<project-slug>.<BASE_DOMAIN>`

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/archive` | Archive project |

### Deployments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/deployments` | List deployments |
| POST | `/api/projects/:id/deploy` | Trigger deploy |
| GET | `/api/deployments/:id` | Deployment details |
| POST | `/api/deployments/:id/stop` | Stop deployment |

### Kubernetes Operations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/k8s/pods` | List pods + status |
| GET | `/api/projects/:id/k8s/logs/:pod` | Stream pod logs |
| POST | `/api/projects/:id/k8s/restart` | Rolling restart |
| POST | `/api/projects/:id/k8s/scale` | Scale replicas |
| POST | `/api/projects/:id/k8s/rollback` | Rollback to previous |

### Environment Variables
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/env` | List env vars |
| POST | `/api/projects/:id/env` | Add env var |
| PATCH | `/api/projects/:id/env/:varId` | Update env var |
| DELETE | `/api/projects/:id/env/:varId` | Delete env var |
| POST | `/api/projects/:id/env/sync` | Sync to K8s |

---

## 🔗 GitHub Webhooks

1. In your GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-backend.com/api/webhooks/github`
3. Content type: `application/json`
4. Secret: same as `GITHUB_WEBHOOK_SECRET` in `.env`
5. Events: `push`, `pull_request`

CloudDeploy will automatically redeploy on every push to the configured branch.

---

## 📊 Monitoring

Access Grafana at http://localhost:3001 (after `kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3001:80`)

Default login: `admin` / `clouddeploy_grafana`

Pre-configured dashboards:
- Kubernetes cluster overview
- Per-namespace resource usage
- Pod CPU/memory/network metrics

---

## 🔒 Security

- **JWT** authentication with refresh tokens (stored in httpOnly cookies)
- **RBAC**: User / Admin roles
- **Helmet.js** for HTTP security headers
- **Rate limiting**: 5 req/15min on auth, 100 req/min on API
- **Kubernetes Secrets** for sensitive env vars
- **HTTPS** via cert-manager + Let's Encrypt
- **HMAC-SHA256** webhook signature verification
- **Namespace isolation** per project

---

## 🗺️ Roadmap

- [x] Phase 1: Core PaaS loop (GitHub → Docker → K8s → URL)
- [x] Phase 2: Auth, project management, env vars, deployment history
- [ ] Phase 3: Runtime log streaming, pod status, metrics dashboard
- [ ] Phase 4: HPA autoscaling, rollback, custom domains, SSL
- [ ] Phase 5: ELK logging, notifications, admin panel, audit logs

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ as a portfolio project demonstrating:
Backend Development · REST API Design · Authentication/Authorization · Docker · Kubernetes · CI/CD · Cloud Infrastructure · Monitoring · Autoscaling · System Design · DevOps Engineering
