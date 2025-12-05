class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
  }

  connect(userId, userType) {
    try {
      console.log(`🔌 Connexion WebSocket pour ${userType}:${userId}`);
      
      this.socket = new WebSocket(`ws://localhost:5002`);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Attendre un peu avant d'envoyer l'identification pour s'assurer que la connexion est stable
        setTimeout(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
              type: 'register',
              userType: userType,
              userId: userId
            }));
            console.log(`📝 Identification envoyée: ${userType}:${userId}`);
          }
        }, 100);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Message WebSocket reçu:', data);
          
          // Notifier tous les listeners
          this.listeners.forEach((callback, key) => {
            try {
              callback(data);
            } catch (err) {
              console.error(`❌ Erreur dans le listener ${key}:`, err);
            }
          });
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket fermé');
        this.isConnected = false;
        this.attemptReconnect(userType, userId);
      };

      this.socket.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };

    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error);
    }
  }

  attemptReconnect(userType, userId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(userId, userType);
      }, this.reconnectInterval);
    } else {
      console.log('❌ Nombre maximum de tentatives de reconnexion atteint');
    }
  }

  addListener(key, callback) {
    this.listeners.set(key, callback);
  }

  removeListener(key) {
    this.listeners.delete(key);
  }

  // Méthodes compatibles avec le hook useWebSocket
  on(event, callback) {
    this.listeners.set(event, callback);
  }

  off(event, callback) {
    this.listeners.delete(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
    this.listeners.clear();
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer:', data);
    }
  }

  // Demander les notifications
  getNotifications() {
    if (this.socket && this.isConnected) {
      this.send({
        type: 'get_notifications'
      });
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de récupérer les notifications');
    }
  }

  // Demander les messages
  getMessages() {
    if (this.socket && this.isConnected) {
      this.send({
        type: 'get_messages'
      });
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de récupérer les messages');
    }
  }

  // Marquer une notification comme lue
  markNotificationAsRead(notificationId) {
    if (this.socket && this.isConnected) {
      this.send({
        type: 'mark_notification_read',
        notificationId: notificationId
      });
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de marquer la notification comme lue');
    }
  }

  // Marquer un message comme lu
  markMessageAsRead(messageId) {
    if (this.socket && this.isConnected) {
      this.send({
        type: 'mark_message_read',
        messageId: messageId
      });
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de marquer le message comme lu');
    }
  }
}

// Instance singleton
const webSocketService = new WebSocketService();

export default webSocketService;