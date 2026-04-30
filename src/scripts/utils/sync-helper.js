import StoryDb from '../data/db';
import StoryApi from '../data/api';
import { showMessage } from './index';

const SyncHelper = {
  async syncPendingStories() {
    if (!navigator.onLine) return;

    const pendingStories = await StoryDb.getAllPendingSync();
    if (pendingStories.length === 0) return;

    console.log(`Syncing ${pendingStories.length} pending stories...`);

    for (const story of pendingStories) {
      try {
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', story.photo);
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);

        const response = await StoryApi.addStory(story.token, formData);
        if (!response.error) {
          await StoryDb.deletePendingSync(story.id);
          console.log('Story synced successfully:', story.id);
        } else {
          console.error('Failed to sync story:', response.message);
        }
      } catch (error) {
        console.error('Sync error:', error);
        break; // Stop syncing if error occurs
      }
    }

    const remaining = await StoryDb.getAllPendingSync();
    if (remaining.length === 0) {
      showMessage('Semua cerita offline telah berhasil disinkronkan!');
    }
  },
};

export default SyncHelper;
