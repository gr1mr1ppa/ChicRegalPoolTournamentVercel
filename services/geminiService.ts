import { GoogleGenAI, Type } from '@google/genai';
import { TournamentSchedule } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const scheduleSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: {
        type: Type.INTEGER,
        description: 'The day number, starting from 1.',
      },
      rounds: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            round: {
              type: Type.INTEGER,
              description: 'The round number for that day, starting from 1.',
            },
            matchups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                    players: {
                        type: Type.ARRAY,
                        description: "An array containing two player names for the matchup, e.g., ['Player 1', 'Player 2']",
                        items: {
                            type: Type.STRING
                        }
                    }
                },
                required: ['players']
              },
              description: 'A list of all matchups for this round.',
            },
          },
          required: ['round', 'matchups'],
        },
        description: 'The rounds scheduled for this day.',
      },
    },
    required: ['day', 'rounds'],
  },
};

export const generateSchedule = async (
  playerNames: string[],
  numDays: number,
  numRounds: number
): Promise<TournamentSchedule> => {
  const numPlayers = playerNames.length;
  const prompt = `
    You are a tournament scheduling expert. Your task is to generate a balanced round-robin style tournament schedule.

    Parameters:
    - Players: ${numPlayers}
    - Player Names: ${playerNames.join(', ')}. You MUST use these exact names in the output.
    - Days: ${numDays}
    - Rounds per day: ${numRounds}

    Constraints:
    1.  The tournament is 1-on-1.
    2.  Each player must play exactly one game in every single round.
    3.  The primary goal is fairness and variety. Ensure that every player faces every other unique opponent at least once over the course of the tournament.
    4.  After all unique pairings have been scheduled, you can schedule repeat matchups if necessary to fill the remaining rounds, but try to space them out. Minimize repeat matchups as much as possible.

    Output the entire schedule in a JSON format that adheres to the provided schema. The output must be only the JSON object, with no surrounding text or markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: scheduleSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    const scheduleData = JSON.parse(jsonText);
    
    // Basic validation of the parsed data
    if (!Array.isArray(scheduleData)) {
      throw new Error("API returned data is not in the expected array format.");
    }

    return scheduleData as TournamentSchedule;
  } catch (error) {
    console.error("Error generating schedule from Gemini API:", error);
    throw new Error("Failed to generate a valid schedule. The model might have returned an unexpected format. Please try again.");
  }
};
