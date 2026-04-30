import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = 'disaster-ready-db';
const DATABASE_VERSION = 1;
const STORE_NAME = 'stories';
const SYNC_STORE_NAME = 'sync-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
      db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

const StoryDb = {
  async getStory(id) {
    return (await dbPromise).get(STORE_NAME, id);
  },
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  async putStory(story) {
    return (await dbPromise).put(STORE_NAME, story);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
  async putAllStories(stories) {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    stories.forEach((story) => tx.store.put(story));
    return tx.done;
  },
  
  // Pending sync methods
  async addPendingSync(storyData) {
    return (await dbPromise).add(SYNC_STORE_NAME, storyData);
  },
  async getAllPendingSync() {
    return (await dbPromise).getAll(SYNC_STORE_NAME);
  },
  async deletePendingSync(id) {
    return (await dbPromise).delete(SYNC_STORE_NAME, id);
  },
};

export default StoryDb;
