import { openai } from './openai';

export class BrandTrackingService {
    scoreConsistency(input: { content: string; brandVoice: string; targetAudience: string; contentGoals: string }): Promise<{ overallScore: number; voiceMatch: number; audienceAlignment: number; goalAlignment: number; suggestions: string[]; offBrandElements: string[] }> {
        return openai.chat.completions.create({
            model: 'gpt-4.0-turbo',
            messages: [
                { role: 'user', content: `Analyze the following content for brand consistency:\n\nContent: ${input.content}\nBrand Voice: ${input.brandVoice}\nTarget Audience: ${input.targetAudience}\nContent Goals: ${input.contentGoals}` }
            ],
            response_format: { type: 'json_object' }
        }).then(response => {
            const scores = response.data;  // handle OpenAI response
            return {
                overallScore: scores.overallScore || 50,
                voiceMatch: scores.voiceMatch || 50,
                audienceAlignment: scores.audienceAlignment || 50,
                goalAlignment: scores.goalAlignment || 50,
                suggestions: scores.suggestions || [],
                offBrandElements: scores.offBrandElements || []
            };
        }).catch(error => {
            console.error('API call failed:', error);
            return {
                overallScore: 50,
                voiceMatch: 50,
                audienceAlignment: 50,
                goalAlignment: 50,
                suggestions: [],
                offBrandElements: []
            };
        });
    }

    compareToBrief(contentBatch: string[], brandBrief: { brandVoice: string; targetAudience: string; contentGoals: string }): Promise<{ averageScores: { overallScore: number; voiceMatch: number; audienceAlignment: number; goalAlignment: number }; outliers: string[] }> {
        const requests = contentBatch.map(content => {
            return openai.chat.completions.create({
                model: 'gpt-4.0-turbo',
                messages: [
                    { role: 'user', content: `Score the following content against the brand brief:\n\nContent: ${content}\nBrand Voice: ${brandBrief.brandVoice}\nTarget Audience: ${brandBrief.targetAudience}\nContent Goals: ${brandBrief.contentGoals}` }
                ],
                response_format: { type: 'json_object' }
            });
        });

        return Promise.all(requests).then(responses => {
            const scoresArray = responses.map(response => response.data);
            const averageScores = {
                overallScore: this.calculateAverage(scoresArray, 'overallScore'),
                voiceMatch: this.calculateAverage(scoresArray, 'voiceMatch'),
                audienceAlignment: this.calculateAverage(scoresArray, 'audienceAlignment'),
                goalAlignment: this.calculateAverage(scoresArray, 'goalAlignment')
            };
            const outliers = this.findOutliers(scoresArray);

            return { averageScores, outliers };
        }).catch(error => {
            console.error('Batch API call failed:', error);
            return {
                averageScores: { overallScore: 50, voiceMatch: 50, audienceAlignment: 50, goalAlignment: 50 },
                outliers: []
            };
        });
    }

    private calculateAverage(scoresArray: any[], key: string) {
        const total = scoresArray.reduce((sum, score) => sum + (score[key] || 50), 0);
        return total / scoresArray.length;
    }

    private findOutliers(scoresArray: any[]) {
        const averageThreshold = 40; // Example threshold for outliers
        return scoresArray.filter(score => score.overallScore < averageThreshold).map(score => score.content);
    }
}

export const brandTrackingService = new BrandTrackingService();