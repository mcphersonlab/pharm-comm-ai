/**
 * NLP Scorer Module (Client-side)
 * Analyzes student messages and scores them on empathy, accuracy, and clarity.
 */

class NLPScorer {
    constructor() {
        // Define keywords for different aspects
        this.empathyKeywords = [
            'understand', 'feel', 'concern', 'worry', 'appreciate',
            'valid', 'important', 'hear', 'listening', 'respect',
            'i see', 'makes sense', 'thank you', 'natural', 'normal'
        ];

        this.accuracyKeywords = {
            vaccine_facts: [
                'clinical trial', 'fda approved', 'tested', 'study', 'research',
                'data', 'evidence', 'scientist', 'peer-reviewed', 'effective'
            ],
            safety_facts: [
                'safe', 'monitored', 'side effects are', 'rare', 'temporary',
                'benefits outweigh', 'millions', 'approved'
            ],
            immune_system: [
                'immune response', 'antibodies', 'protection', 'immunity',
                'immune system', "body's defense"
            ]
        };

        // Misinformation red flags
        this.misinformationFlags = [
            'chip', 'tracking', 'dna change', 'alter dna', 'experimental',
            'not tested', 'rushed', 'conspiracy'
        ];

        // Positive words for simple sentiment analysis
        this.positiveWords = [
            'good', 'great', 'understand', 'help', 'support', 'care', 'safe',
            'effective', 'beneficial', 'protect', 'healthy', 'appreciate',
            'thank', 'happy', 'confident', 'trust', 'reliable', 'proven'
        ];

        // Negative words for simple sentiment analysis
        this.negativeWords = [
            'bad', 'dangerous', 'harmful', 'wrong', 'stupid', 'foolish',
            'refuse', 'hate', 'terrible', 'awful', 'ridiculous', 'nonsense'
        ];
    }

    /**
     * Score a student's message
     * @param {string} message - The student's message
     * @param {string} sessionId - Optional session ID
     * @returns {object} Scores for empathy, accuracy, and clarity
     */
    scoreMessage(message, sessionId = null) {
        if (!message || !message.trim()) {
            return {
                empathy: 0.0,
                accuracy: 0.0,
                clarity: 0.0,
                details: {}
            };
        }

        const empathyScore = this._scoreEmpathy(message);
        const accuracyScore = this._scoreAccuracy(message);
        const clarityScore = this._scoreClarity(message);

        return {
            empathy: Math.round(empathyScore * 100) / 100,
            accuracy: Math.round(accuracyScore * 100) / 100,
            clarity: Math.round(clarityScore * 100) / 100,
            details: {
                word_count: message.split(/\s+/).filter(w => w).length,
                has_question: message.includes('?'),
                sentiment: this._getSentiment(message)
            }
        };
    }

    /**
     * Score empathy based on keywords and sentiment
     */
    _scoreEmpathy(message) {
        const messageLower = message.toLowerCase();
        let score = 0.5; // Base score

        // Check for empathy keywords (already lowercase)
        let empathyCount = 0;
        for (const keyword of this.empathyKeywords) {
            if (messageLower.includes(keyword)) {
                empathyCount++;
            }
        }

        // Boost score based on empathy keywords (up to 0.3)
        score += Math.min(0.3, empathyCount * 0.1);

        // Check for personal pronouns indicating acknowledgment
        const acknowledgmentPhrases = ['your concern', 'your worry', 'you feel', "you're"];
        if (acknowledgmentPhrases.some(phrase => messageLower.includes(phrase))) {
            score += 0.15;
        }

        // Simple sentiment analysis
        const sentiment = this._getSentiment(message);
        if (sentiment.compound > 0.1) {
            score += 0.1;
        } else if (sentiment.compound < -0.1) {
            score -= 0.15;
        }

        // Check for dismissive language
        const dismissivePhrases = ['just', 'simply', 'you should', 'you must', 'you need to'];
        if (dismissivePhrases.some(phrase => messageLower.includes(phrase))) {
            score -= 0.1;
        }

        // Questions can show engagement (except "why" which can be accusatory)
        if (message.includes('?') && !messageLower.includes('why')) {
            score += 0.05;
        }

        return Math.max(0.0, Math.min(1.0, score));
    }

    /**
     * Score accuracy based on factual content
     */
    _scoreAccuracy(message) {
        const messageLower = message.toLowerCase();
        let score = 0.5; // Base score

        // Check for accurate information (keywords already lowercase)
        let accurateKeywords = 0;
        for (const category of Object.values(this.accuracyKeywords)) {
            for (const keyword of category) {
                if (messageLower.includes(keyword)) {
                    accurateKeywords++;
                }
            }
        }

        // Boost for accurate information (up to 0.4)
        score += Math.min(0.4, accurateKeywords * 0.08);

        // Check for misinformation red flags (already lowercase)
        let misinformationCount = 0;
        for (const flag of this.misinformationFlags) {
            if (messageLower.includes(flag)) {
                misinformationCount++;
            }
        }
        if (misinformationCount > 0) {
            score -= 0.3;
        }

        // Boost for mentioning specific data/numbers
        if (/\d+%|\d+ percent/i.test(messageLower) || 
            messageLower.includes('study') || 
            messageLower.includes('trial')) {
            score += 0.15;
        }

        // Check for hedging language (shows appropriate caution)
        const hedging = ['generally', 'typically', 'usually', 'most', 'many'];
        if (hedging.some(word => messageLower.includes(word))) {
            score += 0.05;
        }

        return Math.max(0.0, Math.min(1.0, score));
    }

    /**
     * Score clarity based on readability and structure
     */
    _scoreClarity(message) {
        let score = 0.5; // Base score

        // Word count - should be substantial but not too long
        const wordCount = message.split(/\s+/).filter(w => w).length;
        if (wordCount >= 15 && wordCount <= 60) {
            score += 0.2;
        } else if (wordCount < 10) {
            score -= 0.2;
        } else if (wordCount > 100) {
            score -= 0.15;
        }

        // Sentence count and structure
        const sentences = message.split(/[.!?]+/).filter(s => s.trim());
        const sentenceCount = sentences.length;

        if (sentenceCount >= 1 && sentenceCount <= 4) {
            score += 0.15;
        } else if (sentenceCount > 6) {
            score -= 0.1;
        }

        // Check for proper sentence structure (has at least one period, exclamation, or question)
        if (/[.!?]/.test(message)) {
            score += 0.1;
        }

        // Jargon check - too much technical language reduces clarity
        const jargonTerms = ['immunoglobulin', 'mrna', 'adjuvant', 'epitope',
                           'pathogen', 'antigen', 'cytokine'];
        let jargonCount = 0;
        for (const term of jargonTerms) {
            if (message.toLowerCase().includes(term)) {
                jargonCount++;
            }
        }
        if (jargonCount > 2) {
            score -= 0.15;
        } else if (jargonCount === 1) {
            score += 0.05; // Some technical terms are good
        }

        // Check for clarity indicators
        const clarityPhrases = ['in other words', 'for example', 'this means',
                               'let me explain', 'simply put'];
        if (clarityPhrases.some(phrase => message.toLowerCase().includes(phrase))) {
            score += 0.1;
        }

        return Math.max(0.0, Math.min(1.0, score));
    }

    /**
     * Get simple sentiment analysis of the message
     */
    _getSentiment(message) {
        const words = message.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        let totalWords = words.length;

        for (const word of words) {
            // Clean word of punctuation
            const cleanWord = word.replace(/[^a-z]/g, '');
            if (this.positiveWords.includes(cleanWord)) {
                positiveCount++;
            }
            if (this.negativeWords.includes(cleanWord)) {
                negativeCount++;
            }
        }

        const positive = totalWords > 0 ? positiveCount / totalWords : 0;
        const negative = totalWords > 0 ? negativeCount / totalWords : 0;
        const neutral = 1 - positive - negative;
        const compound = (positiveCount - negativeCount) / Math.max(1, totalWords);

        return {
            compound: Math.round(compound * 100) / 100,
            positive: Math.round(positive * 100) / 100,
            negative: Math.round(negative * 100) / 100,
            neutral: Math.round(Math.max(0, neutral) * 100) / 100
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NLPScorer;
}
