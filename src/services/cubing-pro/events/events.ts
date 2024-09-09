import {EventsAPI} from "@/services/cubing-pro/events/typings";

import {Request} from "@/services/cubing-pro/request";

const CACHE_KEY = 'cachedEvents';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function apiEvents(): Promise<EventsAPI.EventsResponse> {
  const cachedData = localStorage.getItem(CACHE_KEY);

  if (cachedData) {
    const parsedData: EventsAPI.EventsResponse = JSON.parse(cachedData);
    const cacheTime = new Date(parsedData.data.UpdateTime).getTime();
    const currentTime = Date.now();

    if (currentTime - cacheTime < CACHE_DURATION) {
      return parsedData;
    }
  }

  const response = await Request.get<EventsAPI.EventsResponse>("/public/events");
  const newData = response.data;

  // Update the cache
  localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
  return newData;
}
