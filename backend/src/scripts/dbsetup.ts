import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowfox';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await client.connect();
    console.log('Connected successfully to MongoDB.');

    const db = client.db();

    interface User {
      _id: string;
      email: string;
      preferences: { theme: string; email_notifications: boolean };
      created_at: Date;
    }

    interface Activity {
      _id: ObjectId;
      user_id: string;
      action_type: string;
      entity_type: string;
      entity_id: string;
      metadata: Record<string, any>;
      created_at: Date;
    }

    interface Notification {
      _id: ObjectId;
      user_id: string;
      title: string;
      message: string;
      is_read: boolean;
      type: string;
      link: string;
      created_at: Date;
    }

    // Specific collections to seed
    const usersCollection = db.collection<User>('users');
    const activitiesCollection = db.collection<Activity>('activities');
    const notificationsCollection = db.collection<Notification>('notifications');

    // Clear existing data before seeding - can remove if not needed -jw
    console.log('Clearing existing data from seeded collections...');
    await usersCollection.deleteMany({});
    await activitiesCollection.deleteMany({});
    await notificationsCollection.deleteMany({});

    const MAIN_USER_ID = process.env.TEST_CLERK_USER_ID || 'user_2aBxY9ZqH8mWvP3KtRsT4LnC1jF';

    // 1. Users Collection
    const mockUsers = [
      {
        _id: MAIN_USER_ID,
        email: 'linens-creaks-1y@icloud.com',
        preferences: {
          theme: 'dark',
          email_notifications: true
        },
        created_at: new Date('2023-11-01T10:00:00Z')
      },
      {
        _id: 'user_2bCyZ0XwJ7nPcQ4LuUvA2MnD3kE',
        email: 'bob@realemail.com',
        preferences: {
          theme: 'light',
          email_notifications: false
        },
        created_at: new Date('2024-01-15T14:30:00Z')
      },
      {
        _id: 'user_2cDaW1YmK9rTdM5VxRsB9LpV8sT',
        email: 'carol@realemail.com',
        preferences: {
          theme: 'system',
          email_notifications: true
        },
        created_at: new Date('2024-02-28T09:15:00Z')
      }
    ];

    console.log('Inserting mock users...');
    await usersCollection.insertMany(mockUsers);

    // 2. Activities Collection
    const mockActivities = [
      {
        _id: new ObjectId(),
        user_id: MAIN_USER_ID,
        action_type: 'CREATED_DOCUMENT',
        entity_type: 'DOCUMENT',
        entity_id: 'doc_101',
        metadata: { title: "Project Alpha Requirements" },
        created_at: new Date('2024-03-01T08:00:00Z')
      },
      {
        _id: new ObjectId(),
        user_id: 'user_2bCyZ0XwJ7nPcQ4LuUvA2MnD3kE',
        action_type: 'FAVORITED_MINDMAP',
        entity_type: 'MINDMAP',
        entity_id: 'mm_505',
        metadata: { previous_state: "unfavorited" },
        created_at: new Date('2024-03-05T11:20:00Z')
      },
      {
        _id: new ObjectId(),
        'user_id': MAIN_USER_ID,
        action_type: 'UPDATED_TASK',
        entity_type: 'TASK',
        entity_id: 'task_882',
        metadata: { old_status: "TODO", new_status: "IN_PROGRESS" },
        created_at: new Date('2024-03-10T09:45:00Z')
      },
      {
        _id: new ObjectId(),
        user_id: 'user_2cDaW1YmK9rTdM5VxRsB9LpV8sT',
        action_type: 'UPDATED_DOCUMENT',
        entity_type: 'DOCUMENT',
        entity_id: 'doc_101',
        metadata: { old_name: "Project Alpha Requirements", new_name: "Project Alpha - Final Requirements" },
        created_at: new Date('2024-03-12T16:00:00Z')
      }
    ];

    console.log('Inserting mock activities...');
    await activitiesCollection.insertMany(mockActivities);

    // 3. Notifications Collection
    const mockNotifications = [
      {
        _id: new ObjectId(),
        'user_id': MAIN_USER_ID,
        title: 'Mindmap Created',
        message: 'Flowfox has finished creating the mindmap',
        is_read: false,
        type: 'SYSTEM_UPDATE',
        link: '/documents/doc_101',
        created_at: new Date('2024-03-12T16:05:00Z')
      },
      {
        _id: new ObjectId(),
        user_id: 'user_2bCyZ0XwJ7nPcQ4LuUvA2MnD3kE',
        title: 'Mindmap Output',
        message: 'Flowfox has finished exporting the mindmap',
        is_read: true,
        type: 'SYSTEM_UPDATE',
        link: '/mindmaps/mm_102',
        created_at: new Date('2024-03-14T10:00:00Z')
      },
      {
        _id: new ObjectId(),
        user_id: 'user_2cDaW1YmK9rTdM5VxRsB9LpV8sT',
        title: 'Task Reminder',
        message: 'Your task "Review design comps" is due tomorrow.',
        is_read: false,
        type: 'REMINDER',
        link: '/tasks/task_905',
        created_at: new Date('2024-03-15T08:00:00Z')
      }
    ];

    console.log('Inserting mock notifications...');
    await notificationsCollection.insertMany(mockNotifications);

    console.log('Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

seedDatabase();
