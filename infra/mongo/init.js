// MongoDB initialization script
// Runs automatically when the MongoDB container first starts

db = db.getSiblingDB('clouddeploy');

// Create application user with limited permissions
db.createUser({
  user: 'clouddeploy_app',
  pwd: 'clouddeploy_app_password',
  roles: [
    { role: 'readWrite', db: 'clouddeploy' }
  ]
});

// Create indexes for performance
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ emailVerificationToken: 1 });
db.users.createIndex({ passwordResetToken: 1 });

// Projects
db.projects.createIndex({ userId: 1 });
db.projects.createIndex({ slug: 1 }, { unique: true });
db.projects.createIndex({ userId: 1, status: 1 });
db.projects.createIndex({ name: 'text', description: 'text' }); // Full-text search

// Deployments
db.deployments.createIndex({ projectId: 1, createdAt: -1 });
db.deployments.createIndex({ userId: 1, createdAt: -1 });
db.deployments.createIndex({ status: 1 });

// Logs
db.logs.createIndex({ deploymentId: 1, timestamp: 1 });
db.logs.createIndex({ projectId: 1, timestamp: -1 });
// TTL index: auto-delete runtime logs older than 30 days
db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// EnvVariables
db.envvariables.createIndex({ projectId: 1 });
db.envvariables.createIndex({ projectId: 1, key: 1 }, { unique: true });

// AuditLogs
db.auditlogs.createIndex({ userId: 1, timestamp: -1 });
db.auditlogs.createIndex({ timestamp: -1 });
// TTL: auto-delete audit logs older than 90 days
db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

print('CloudDeploy database initialized successfully');
