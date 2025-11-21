
/**
 * @fileOverview Predicts the real-time election outcome based on current vote statistics.
 *
 * - predictElectionOutcome - A function that handles the prediction of the election outcome.
 * - PredictElectionOutcomeInput - The input type for the predictElectionOutcome function.
 * - PredictElectionOutcomeOutput - The return type for the predictElectionOutcome function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictElectionOutcomeInputSchema = z.object({
  electionId: z.string().describe('The ID of the election to predict.'),
  votes: z.record(z.string(), z.string()).describe('A map of voter IDs to candidate IDs.'),
  candidates: z.record(z.string(), z.object({
    name: z.string(),
    viceCandidateName: z.string().optional(),
    photo: z.string().optional(),
    vision: z.string().optional(),
    mission: z.string().optional()
  })).describe('Details of all candidates in the election')
});
export type PredictElectionOutcomeInput = z.infer<typeof PredictElectionOutcomeInputSchema>;

const PredictElectionOutcomeOutputSchema = z.object({
  predictedOutcome: z.record(z.string(), z.number()).describe('A map of candidate IDs to their predicted vote percentage.'),
  marginOfError: z.number().describe('The margin of error for the prediction, as a percentage.'),
  confidenceLevel: z.number().describe('The confidence level of the prediction, as a percentage.')
});
export type PredictElectionOutcomeOutput = z.infer<typeof PredictElectionOutcomeOutputSchema>;

export async function predictElectionOutcome(input: PredictElectionOutcomeInput): Promise<PredictElectionOutcomeOutput> {
  return predictElectionOutcomeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictElectionOutcomePrompt',
  input: {schema: PredictElectionOutcomeInputSchema},
  output: {schema: PredictElectionOutcomeOutputSchema},
  prompt: `You are an expert in statistical analysis and election prediction. Given the current vote counts for an election, predict the final outcome.`,
});

const predictElectionOutcomeFlow = ai.defineFlow(
  {
    name: 'predictElectionOutcomeFlow',
    inputSchema: PredictElectionOutcomeInputSchema,
    outputSchema: PredictElectionOutcomeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
