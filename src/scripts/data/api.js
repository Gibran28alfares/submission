import CONFIG from '../config';
import StoryDb from './db';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

const StoryApi = {
  async register({ name, email, password }) {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return await response.json();
  },

  async login({ email, password }) {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  },

  async getAllStories(token) {
    try {
      const response = await fetch(`${ENDPOINTS.STORIES}?location=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseJson = await response.json();
      
      if (!responseJson.error) {
        await StoryDb.putAllStories(responseJson.listStory);
      }
      
      return responseJson;
    } catch (error) {
      console.warn('Network failed, falling back to IndexedDB', error);
      const cachedStories = await StoryDb.getAllStories();
      return {
        error: false,
        message: 'Stories fetched from cache (Offline Mode)',
        listStory: cachedStories,
      };
    }
  },

  async getStoryDetail(token, id) {
    const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  },

  async addStory(token, formData) {
    const response = await fetch(ENDPOINTS.ADD_STORY, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await response.json();
  },

  async subscribePush(token, subscription) {
    const sub = JSON.parse(JSON.stringify(subscription));
    delete sub.expirationTime;
    
    console.log('Sending subscription to server:', sub);

    const response = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sub),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      console.error('Server rejected subscription:', responseJson);
    }
    return responseJson;
  },

  async unsubscribePush(token, subscription) {
    const response = await fetch(ENDPOINTS.UNSUBSCRIBE, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });
    return await response.json();
  },
};

export default StoryApi;
