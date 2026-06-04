import express from 'express';
import path from 'path';
import fs from 'fs';
import webPush from 'web-push';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, orderBy, limit, doc, setDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { createServer as createViteServer } from 'vite';

// Read firebase configuration from config file
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(firebaseApp);

// Initialize VAPID Keys
const vapidPath = path.join(process.cwd(), 'vapid.json');
let vapidKeys: { publicKey: string; privateKey: string };
if (fs.existsSync(vapidPath)) {
  vapidKeys = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
} else {
  vapidKeys = webPush.generateVAPIDKeys();
  fs.writeFileSync(vapidPath, JSON.stringify(vapidKeys, null, 2));
}

webPush.setVapidDetails(
  'mailto:vbbubuludu@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Authenticate server client so it complies with firestore.rules
const authenticateServer = async () => {
  try {
    await signInWithEmailAndPassword(auth, 'system-notifications@app.local', 'SecureSystemPassword123!').catch(async () => {
      await createUserWithEmailAndPassword(auth, 'system-notifications@app.local', 'SecureSystemPassword123!');
    });
    console.log('Firebase system-notifications user authenticated successfully');
  } catch (e) {
    console.error('Firebase server sign in failed. Retrying in 5 seconds...', e);
    setTimeout(authenticateServer, 5000);
  }
};

async function sendPushToUser(userId: string, title: string, body: string, data: any = {}) {
  try {
    const q = query(collection(db, 'push_subscriptions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    
    const sendPromises = snap.docs.map(async (docSnap) => {
      const sub = docSnap.data();
      const subscription = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };
      
      try {
        await webPush.sendNotification(subscription, JSON.stringify({ title, body, data }));
        console.log(`Push notification sent successfully to subscriber ${docSnap.id}`);
      } catch (err: any) {
        console.error(`Push failed for sub ${docSnap.id}:`, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription ${docSnap.id}`);
          await deleteDoc(doc(db, 'push_subscriptions', docSnap.id));
        }
      }
    });
    
    await Promise.all(sendPromises);
  } catch (e) {
    console.error('Error sending push to user:', userId, e);
  }
}

async function sendPushToAllExcept(excludeUserId: string, title: string, body: string, data: any = {}) {
  try {
    const snap = await getDocs(collection(db, 'push_subscriptions'));
    
    const sendPromises = snap.docs.map(async (docSnap) => {
      const sub = docSnap.data();
      if (sub.userId === excludeUserId) return;
      
      const subscription = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };
      
      try {
        await webPush.sendNotification(subscription, JSON.stringify({ title, body, data }));
        console.log(`Push notification sent to all-except subscriber ${docSnap.id}`);
      } catch (err: any) {
        console.error(`Push failed for sub ${docSnap.id}:`, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription ${docSnap.id}`);
          await deleteDoc(doc(db, 'push_subscriptions', docSnap.id));
        }
      }
    });
    
    await Promise.all(sendPromises);
  } catch (e) {
    console.error('Error sending push to all except:', excludeUserId, e);
  }
}

// Start listeners for database entries
const setupDatabaseListeners = () => {
  const serverBootTime = new Date().toISOString();
  console.log(`Database watchers monitoring entries created after: ${serverBootTime}`);

  // Monitor Global Activity
  let initialActivities = true;
  onSnapshot(query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(1)), (snap) => {
    if (initialActivities) {
      initialActivities = false;
      return;
    }
    
    snap.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data.createdAt) {
          // Firebase timestamps can be strings or ServerTimestamp objects
          const timeStr = typeof data.createdAt === 'string' ? data.createdAt : 
                          data.createdAt.toDate ? data.createdAt.toDate().toISOString() : '';
          
          if (timeStr && timeStr > serverBootTime) {
            const title = 'Новая активность 🚀';
            const body = `${data.actorName || 'Кто-то'} ${data.actionType || 'сделал(а) действие'} ${data.targetName || ''}`;
            console.log(`Watcher: Activity added: ${body}. Broadcasting notifications...`);
            await sendPushToAllExcept(data.actorId, title, body, { url: '/' });
          }
        }
      }
    });
  }, (err) => {
    console.error('Watcher activities snapshot error: ', err);
  });

  // Monitor Direct Messages
  let initialMessages = true;
  onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(1)), (snap) => {
    if (initialMessages) {
      initialMessages = false;
      return;
    }
    
    snap.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data.createdAt) {
          const timeStr = typeof data.createdAt === 'string' ? data.createdAt : 
                          data.createdAt.toDate ? data.createdAt.toDate().toISOString() : '';
          
          if (timeStr && timeStr > serverBootTime) {
            const title = 'Новое сообщение 💬';
            const body = `${data.content || 'Файл/фото или сообщение'}`;
            
            // Look up sender's name to display
            let senderName = 'Коллега';
            try {
              const senderRef = doc(db, 'users', data.senderId);
              const senderSnap = await getDoc(senderRef);
              if (senderSnap.exists()) {
                senderName = senderSnap.data().username || senderSnap.data().email || 'Коллега';
              }
            } catch (err) {
              console.error('Failed to resolve sender details:', err);
            }

            const formattedBody = `${senderName}: ${body}`;
            
            if (data.receiverId) {
              console.log(`Watcher: Personal message to ${data.receiverId}. Sending direct notification...`);
              await sendPushToUser(data.receiverId, title, formattedBody, { url: '/?tab=network' });
            } else {
              console.log(`Watcher: Message in main pool. Broadcasting...`);
              await sendPushToAllExcept(data.senderId, title, formattedBody, { url: '/?tab=network' });
            }
          }
        }
      }
    });
  }, (err) => {
    console.error('Watcher messages snapshot error: ', err);
  });
};

async function start() {
  await authenticateServer();
  setupDatabaseListeners();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Get Public VAPID Key
  app.get('/api/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // API Route - Subscribe Device for Push Notifications
  app.post('/api/push/subscribe', async (req, res) => {
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Missing subscription or userId' });
    }

    try {
      // Securely construct a firestore document id from the push endpoint to avoid duplicates
      const subId = Buffer.from(subscription.endpoint).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-100);
      const subRef = doc(db, 'push_subscriptions', subId);
      await setDoc(subRef, {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys || {},
        createdAt: new Date().toISOString()
      });
      console.log(`Device subscribed successfully for userId: ${userId}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to persist subscriptions:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route - Trigger background push test for testing closed-app delivery
  app.post('/api/push/test', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    console.log(`Triggering background push test for userId: ${userId} in 3 seconds`);
    setTimeout(async () => {
      await sendPushToUser(
        userId,
        'Тестовый сигнал 🧪',
        'Фоновые push-уведомления работают круглосуточно (24/7), когда приложение закрыто!'
      );
    }, 3000);

    res.json({
      success: true,
      message: 'Тест запущен. Сверните приложение или заблокируйте экран. Сигнал поступит через 3 секунды.'
    });
  });

  // Integrate Vite for development, or serve built assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fullstack PWA application running round-the-clock on http://localhost:${PORT}`);
  });
}

start();
