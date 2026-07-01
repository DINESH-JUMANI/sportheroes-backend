export interface SportConfig {
  name: string;
  key: string;
  scoringRules: {
    pointsToWinSet: number;
    differenceToWinSet: number;
    bestOfSets: number; // e.g. 5 for best of 5 (first to 3 sets wins)
    maxPointsLimit?: number; // e.g. max 30 points in badminton
    finalSetRules?: {
      pointsToWinSet: number;
      differenceToWinSet: number;
    };
  };
  eventTypes: string[]; // Event types recorded in the event stream
}

export const TableTennisConfig: SportConfig = {
  name: 'Table Tennis',
  key: 'table_tennis',
  scoringRules: {
    pointsToWinSet: 11,
    differenceToWinSet: 2,
    bestOfSets: 5, // Best of 5 (first to 3 sets wins)
  },
  eventTypes: [
    'point_won',      // Standard point won
    'ace',            // Direct serve ace
    'serve_error',    // Fault on serve
    'receive_error',  // Unreturned serve or receive mistake
    'rally_won',      // Point won after rally
    'error'           // Generic unforced/forced error
  ],
};
