'use server';

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
  prompt: `You are an expert in statistical analysis and election prediction. Given the current vote counts for an election, you will predict the final outcome, including a margin of error.

Election ID: {{{electionId}}}
Current Vote Data: {{{votes}}}
Candidate Details: {{{candidates}}}

Consider the following:
- The number of votes cast so far.
- The distribution of votes among candidates.
- Any patterns or trends in the voting data.

Based on this information, provide:
1. A predicted outcome, showing the percentage of votes each candidate is likely to receive.
2. A margin of error for your prediction, indicating the range within which the actual results are likely to fall.
3. A confidence level for your prediction, indicating how certain you are about the predicted outcome.

Ensure that the predictedOutcome object contains the candidate IDs and their corresponding predicted vote percentages. The marginOfError should be a single number indicating the overall uncertainty in the prediction, and confidenceLevel indicating how sure you are about the predicted outcome.`,
});

const predictElectionOutcomeFlow = ai.defineFlow(
  {
    name: 'predictElectionOutcomeFlow',
    inputSchema: PredictElectionOutcomeInputSchema,
    outputSchema: PredictElectionOutcomeOutputSchema,
  },
  async input => {
    // Basic input validation. More sophisticated validation could be added.
    if (!input.electionId || !input.votes || !input.candidates) {
      throw new Error('Missing required input parameters.');
    }

    const {output} = await prompt(input);
    return output!;
  }
);
