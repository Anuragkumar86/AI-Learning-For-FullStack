import { tool } from 'ai';
import { z } from 'zod';

export const getWeather = tool({
  description: 'Get the weather for a city',
  inputSchema: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    // Demo data. Replace this with a real weather API call later.
    return {
      city,
      temperatureC: 31,
      condition: 'Mausam is too Sunny and hot Bhai...😒',
    };
  },
});