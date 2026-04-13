import OpenAI from 'openai';

// Securely load the OpenAI API Key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native usage
});

export type NLPResult =
  | { type: 'start', title: string }
  | { type: 'manual', title: string, durationMinutes: number }
  | { type: 'error', message: string };

export async function parseNaturalLanguage(input: string): Promise<NLPResult> {
  if (!OPENAI_API_KEY) {
    return { type: 'error', message: 'API Key not configured' };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for the Klowk time tracking app. 
          Analyze user input and decide if they want to START a timer NOW or LOG a past activity.
          
          If STARTING now: return JSON {"type": "start", "title": "activity name"}
          If LOGGING past activity: return JSON {"type": "manual", "title": "activity name", "durationMinutes": number_of_minutes}
          
          Example: "I am going to the gym" -> {"type": "start", "title": "Gym"}
          Example: "Gym for 1 hour" -> {"type": "manual", "title": "Gym", "durationMinutes": 60}
          Example: "Worked on website for 30 mins" -> {"type": "manual", "title": "Website", "durationMinutes": 30}
          
          Only return the JSON object.`
        },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    return JSON.parse(content) as NLPResult;
  } catch (error) {
    console.error('NLP Parsing error:', error);
    return { type: 'error', message: 'Failed to understand' };
  }
}
