"""
Feedback Generator Module
Generates detailed, actionable feedback based on NLP scores.
"""


class FeedbackGenerator:
    """Generates feedback for student responses."""
    
    def __init__(self):
        pass
    
    def generate_feedback(self, message, scores):
        """
        Generate comprehensive feedback based on scores.
        
        Args:
            message: The student's message
            scores: NLP scores dictionary
            
        Returns:
            dict: Detailed feedback with suggestions
        """
        empathy_score = scores.get('empathy', 0)
        accuracy_score = scores.get('accuracy', 0)
        clarity_score = scores.get('clarity', 0)
        
        feedback = {
            'overall': self._get_overall_feedback(empathy_score, accuracy_score, clarity_score),
            'empathy': self._get_empathy_feedback(empathy_score, message),
            'accuracy': self._get_accuracy_feedback(accuracy_score, message),
            'clarity': self._get_clarity_feedback(clarity_score, message),
            'suggestions': self._get_suggestions(scores, message),
            'strengths': self._get_strengths(scores, message)
        }
        
        return feedback
    
    def _get_overall_feedback(self, empathy, accuracy, clarity):
        """Generate overall performance feedback."""
        avg_score = (empathy + accuracy + clarity) / 3
        
        if avg_score >= 0.8:
            return "Excellent response! You demonstrated strong empathy, provided accurate information, and communicated clearly."
        elif avg_score >= 0.65:
            return "Good response. You're on the right track, but there's room for improvement in some areas."
        elif avg_score >= 0.5:
            return "Fair response. Consider focusing on building rapport and providing clearer information."
        else:
            return "This response needs improvement. Focus on being more empathetic and providing accurate, clear information."
    
    def _get_empathy_feedback(self, score, message):
        """Generate empathy-specific feedback."""
        feedback = {
            'score': score,
            'level': self._get_level(score),
            'message': ''
        }
        
        if score >= 0.75:
            feedback['message'] = "You demonstrated excellent empathy by acknowledging the patient's concerns and showing understanding."
        elif score >= 0.6:
            feedback['message'] = "You showed good empathy. To improve, try using more phrases that validate the patient's feelings."
        elif score >= 0.4:
            feedback['message'] = "Your empathy could be stronger. Remember to acknowledge the patient's concerns before providing information."
        else:
            feedback['message'] = "Try to be more empathetic. Start by validating the patient's feelings with phrases like 'I understand your concern' or 'That's a valid worry.'"
        
        return feedback
    
    def _get_accuracy_feedback(self, score, message):
        """Generate accuracy-specific feedback."""
        feedback = {
            'score': score,
            'level': self._get_level(score),
            'message': ''
        }
        
        if score >= 0.75:
            feedback['message'] = "You provided accurate, evidence-based information. Well done!"
        elif score >= 0.6:
            feedback['message'] = "Good accuracy. Consider adding specific data or studies to strengthen your response."
        elif score >= 0.4:
            feedback['message'] = "Include more factual information. Reference clinical trials, FDA approval, or specific statistics."
        else:
            feedback['message'] = "Your response needs more accurate information. Avoid speculation and focus on evidence-based facts about vaccine safety and efficacy."
        
        return feedback
    
    def _get_clarity_feedback(self, score, message):
        """Generate clarity-specific feedback."""
        feedback = {
            'score': score,
            'level': self._get_level(score),
            'message': ''
        }
        
        word_count = len(message.split())
        
        if score >= 0.75:
            feedback['message'] = "Your message was clear and well-structured. Great job!"
        elif score >= 0.6:
            feedback['message'] = "Generally clear. Try to organize your thoughts into 2-3 concise sentences."
        elif score >= 0.4:
            if word_count < 15:
                feedback['message'] = "Your response is too brief. Provide more detail to address the patient's concerns."
            else:
                feedback['message'] = "Simplify your language. Avoid excessive jargon and keep sentences concise."
        else:
            if word_count < 10:
                feedback['message'] = "Your response is too short. Elaborate more to address the patient's concerns thoroughly."
            else:
                feedback['message'] = "Your response is unclear or too complex. Use simpler language and break down information into digestible parts."
        
        return feedback
    
    def _get_suggestions(self, scores, message):
        """Generate actionable suggestions for improvement."""
        suggestions = []
        
        empathy = scores.get('empathy', 0)
        accuracy = scores.get('accuracy', 0)
        clarity = scores.get('clarity', 0)
        
        # Empathy suggestions
        if empathy < 0.6:
            suggestions.append({
                'category': 'Empathy',
                'tip': "Start your response by acknowledging the patient's feelings: 'I understand why you might feel that way...'",
                'example': "I can see why you're concerned about side effects. Many people share that worry, and it's completely valid."
            })
        
        # Accuracy suggestions
        if accuracy < 0.6:
            suggestions.append({
                'category': 'Accuracy',
                'tip': "Include specific facts and data to support your points.",
                'example': "Clinical trials with over 30,000 participants showed that the vaccine is over 90% effective and has a strong safety profile."
            })
        
        # Clarity suggestions
        if clarity < 0.6:
            word_count = len(message.split())
            if word_count < 15:
                suggestions.append({
                    'category': 'Clarity',
                    'tip': "Provide more detailed information while staying focused.",
                    'example': "Expand your response to include specific examples and explanations that address the patient's concern."
                })
            else:
                suggestions.append({
                    'category': 'Clarity',
                    'tip': "Keep your response concise and focused on 1-2 main points.",
                    'example': "Break complex information into shorter, more digestible sentences."
                })
        
        # Question suggestion
        if '?' not in message:
            suggestions.append({
                'category': 'Engagement',
                'tip': "Ask follow-up questions to better understand the patient's concerns.",
                'example': "What specifically worries you most about the vaccine?"
            })
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def _get_strengths(self, scores, message):
        """Identify strengths in the response."""
        strengths = []
        
        empathy = scores.get('empathy', 0)
        accuracy = scores.get('accuracy', 0)
        clarity = scores.get('clarity', 0)
        
        if empathy >= 0.7:
            strengths.append("Strong empathetic communication")
        
        if accuracy >= 0.7:
            strengths.append("Accurate, evidence-based information")
        
        if clarity >= 0.7:
            strengths.append("Clear and concise communication")
        
        if '?' in message:
            strengths.append("Good use of questions for engagement")
        
        message_lower = message.lower()
        if any(phrase in message_lower for phrase in ['understand', 'I hear', 'appreciate']):
            strengths.append("Acknowledges patient perspective")
        
        return strengths if strengths else ["Keep practicing to develop your strengths"]
    
    def _get_level(self, score):
        """Convert numerical score to level."""
        if score >= 0.8:
            return "Excellent"
        elif score >= 0.65:
            return "Good"
        elif score >= 0.5:
            return "Fair"
        else:
            return "Needs Improvement"
