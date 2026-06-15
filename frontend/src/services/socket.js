import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket = null;

function getSocket() {
  if (!socket) {
    const token = useAuthStore.getState().token;
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function joinDeploymentRoom(deploymentId) {
  const s = getSocket();
  s.emit('join:deployment', { deploymentId });
}

export function leaveDeploymentRoom(deploymentId) {
  if (!socket) return;
  socket.emit('leave:deployment', { deploymentId });
}

export function joinProjectRoom(projectId) {
  const s = getSocket();
  s.emit('join:project', { projectId });
}

export function leaveProjectRoom(projectId) {
  if (!socket) return;
  socket.emit('leave:project', { projectId });
}

export function onDeploymentLog(callback) {
  const s = getSocket();
  s.on('deployment:log', callback);
  return () => s.off('deployment:log', callback);
}

export function onDeploymentStatus(callback) {
  const s = getSocket();
  s.on('deployment:status', callback);
  return () => s.off('deployment:status', callback);
}

export function onPodStatus(callback) {
  const s = getSocket();
  s.on('pod:status', callback);
  return () => s.off('pod:status', callback);
}

export function onRuntimeLog(callback) {
  const s = getSocket();
  s.on('runtime:log', callback);
  return () => s.off('runtime:log', callback);
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { getSocket, joinDeploymentRoom, leaveDeploymentRoom, joinProjectRoom, leaveProjectRoom, onDeploymentLog, onDeploymentStatus, onPodStatus, onRuntimeLog, disconnect };
