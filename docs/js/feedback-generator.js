/**
 * Feedback Generator Module (Client-side)
 * Generates detailed, actionable feedback based on NLP scores.
 */

class FeedbackGenerator {
    constructor() {
        // No initialization needed
    }

    /**
     * Generate comprehensive feedback based on scores
     * @param {string} message - The student's message
     * @param {object} scores - NLP scores
     * @returns {object} Detailed feedback with suggestions
     */
    generateFeedback(message, scores) {
        const empathyScore = scores.empathy || 0;
        const accuracyScore = scores.accuracy || 0;
        const clarityScore = scores.clarity || 0;

        return {
            overall: this._getOverallFeedback(empathyScore, accuracyScore, clarityScore),
            empathy: this._getEmpathyFeedback(empathyScore, message),
            accuracy: this._getAccuracyFeedback(accuracyScore, message),
            clarity: this._getClarityFeedback(clarityScore, message),
            suggestions: this._getSuggestions(scores, message),
            strengths: this._getStrengths(scores, message)
        };
    }

    /**
     * Generate overall performance feedback
     */
    _getOverallFeedback(empathy, accuracy, clarity) {
        const avgScore = (empathy + accuracy + clarity) / 3;

        if (avgScore >= 0.8) {
            return "Excellent response! You demonstrated strong empathy, provided accurate information, and communicated clearly.";
        } else if (avgScore >= 0.65) {
            return "Good response. You're on the right track, but there's room for improvement in some areas.";
        } else if (avgScore >= 0.5) {
            return "Fair response. Consider focusing on building rapport and providing clearer information.";
        } else {
            return "This response needs improvement. Focus on being more empathetic and providing accurate, clear information.";
        }
    }

    /**
     * Generate empathy-specific feedback
     */
    _getEmpathyFeedback(score, message) {
        const feedback = {
            score: score,
            level: this._getLevel(score),
            message: ''
        };

        if (score >= 0.75) {
            feedback.message = "You demonstrated excellent empathy by acknowledging the patient's concerns and showing understanding.";
        } else if (score >= 0.6) {
            feedback.message = "You showed good empathy. To improve, try using more phrases that validate the patient's feelings.";
        } else if (score >= 0.4) {
            feedback.message = "Your empathy could be stronger. Remember to acknowledge the patient's concerns before providing information.";
        } else {
            feedback.message = "Try to be more empathetic. Start by validating the patient's feelings with phrases like 'I understand your concern' or 'That's a valid worry.'";
        }

        return feedback;
    }

    /**
     * Generate accuracy-specific feedback
     */
    _getAccuracyFeedback(score, message) {
        const feedback = {
            score: score,
            level: this._getLevel(score),
            message: ''
        };

        if (score >= 0.75) {
            feedback.message = "You provided accurate, evidence-based information. Well done!";
        } else if (score >= 0.6) {
            feedback.message = "Good accuracy. Consider adding specific data or studies to strengthen your response.";
        } else if (score >= 0.4) {
            feedback.message = "Include more factual information. Reference clinical trials, FDA approval, or specific statistics.";
        } else {
            feedback.message = "Your response needs more accurate information. Avoid speculation and focus on evidence-based facts about vaccine safety and efficacy.";
        }

        return feedback;
    }

    /**
     * Generate clarity-specific feedback
     */
    _getClarityFeedback(score, message) {
        const feedback = {
            score: score,
            level: this._getLevel(score),
            message: ''
        };

        const wordCount = message.split(/\s+/).filter(w => w).length;

        if (score >= 0.75) {
            feedback.message = "Your message was clear and well-structured. Great job!";
        } else if (score >= 0.6) {
            feedback.message = "Generally clear. Try to organize your thoughts into 2-3 concise sentences.";
        } else if (score >= 0.4) {
            if (wordCount < 15) {
                feedback.message = "Your response is too brief. Provide more detail to address the patient's concerns.";
            } else {
                feedback.message = "Simplify your language. Avoid excessive jargon and keep sentences concise.";
            }
        } else {
            if (wordCount < 10) {
                feedback.message = "Your response is too short. Elaborate more to address the patient's concerns thoroughly.";
            } else {
                feedback.message = "Your response is unclear or too complex. Use simpler language and break down information into digestible parts.";
            }
        }

        return feedback;
    }

    /**
     * Generate actionable suggestions for improvement
     */
    _getSuggestions(scores, message) {
        const suggestions = [];

        const empathy = scores.empathy || 0;
        const accuracy = scores.accuracy || 0;
        const clarity = scores.clarity || 0;

        // Empathy suggestions
        if (empathy < 0.6) {
            suggestions.push({
                category: 'Empathy',
                tip: "Start your response by acknowledging the patient's feelings: 'I understand why you might feel that way...'",
                example: "I can see why you're concerned about side effects. Many people share that worry, and it's completely valid."
            });
        }

        // Accuracy suggestions
        if (accuracy < 0.6) {
            suggestions.push({
                category: 'Accuracy',
                tip: "Include specific facts and data to support your points.",
                example: "Clinical trials with over 30,000 participants showed that the vaccine is over 90% effective and has a strong safety profile."
            });
        }

        // Clarity suggestions
        if (clarity < 0.6) {
            const wordCount = message.split(/\s+/).filter(w => w).length;
            if (wordCount < 15) {
                suggestions.push({
                    category: 'Clarity',
                    tip: "Provide more detailed information while staying focused.",
                    example: "Expand your response to include specific examples and explanations that address the patient's concern."
                });
            } else {
                suggestions.push({
                    category: 'Clarity',
                    tip: "Keep your response concise and focused on 1-2 main points.",
                    example: "Break complex information into shorter, more digestible sentences."
                });
            }
        }

        // Question suggestion
        if (!message.includes('?')) {
            suggestions.push({
                category: 'Engagement',
                tip: "Ask follow-up questions to better understand the patient's concerns.",
                example: "What specifically worries you most about the vaccine?"
            });
        }

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }

    /**
     * Identify strengths in the response
     */
    _getStrengths(scores, message) {
        const strengths = [];

        const empathy = scores.empathy || 0;
        const accuracy = scores.accuracy || 0;
        const clarity = scores.clarity || 0;

        if (empathy >= 0.7) {
            strengths.push("Strong empathetic communication");
        }

        if (accuracy >= 0.7) {
            strengths.push("Accurate, evidence-based information");
        }

        if (clarity >= 0.7) {
            strengths.push("Clear and concise communication");
        }

        if (message.includes('?')) {
            strengths.push("Good use of questions for engagement");
        }

        const messageLower = message.toLowerCase();
        if (['understand', 'i hear', 'appreciate'].some(phrase => messageLower.includes(phrase))) {
            strengths.push("Acknowledges patient perspective");
        }

        return strengths.length > 0 ? strengths : ["Keep practicing to develop your strengths"];
    }

    /**
     * Convert numerical score to level
     */
    _getLevel(score) {
        if (score >= 0.8) {
            return "Excellent";
        } else if (score >= 0.65) {
            return "Good";
        } else if (score >= 0.5) {
            return "Fair";
        } else {
            return "Needs Improvement";
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackGenerator;
}
