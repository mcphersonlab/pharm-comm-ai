"""
NLP Scorer Module
Analyzes student messages and scores them on empathy, accuracy, and clarity.
"""

import re
from textblob import TextBlob
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer


class NLPScorer:
    """Scores student responses using NLP techniques."""
    
    def __init__(self):
        # Download required NLTK data
        try:
            nltk.data.find('vader_lexicon')
        except LookupError:
            nltk.download('vader_lexicon', quiet=True)
        
        self.sia = SentimentIntensityAnalyzer()
        
        # Define keywords for different aspects
        self.empathy_keywords = [
            'understand', 'feel', 'concern', 'worry', 'appreciate',
            'valid', 'important', 'hear', 'listening', 'respect',
            'I see', 'makes sense', 'thank you', 'natural', 'normal'
        ]
        
        self.accuracy_keywords = {
            'vaccine_facts': [
                'clinical trial', 'FDA approved', 'tested', 'study', 'research',
                'data', 'evidence', 'scientist', 'peer-reviewed', 'effective'
            ],
            'safety_facts': [
                'safe', 'monitored', 'side effects are', 'rare', 'temporary',
                'benefits outweigh', 'millions', 'approved'
            ],
            'immune_system': [
                'immune response', 'antibodies', 'protection', 'immunity',
                'immune system', 'body\'s defense'
            ]
        }
        
        # Misinformation red flags
        self.misinformation_flags = [
            'chip', 'tracking', 'DNA change', 'alter DNA', 'experimental',
            'not tested', 'rushed', 'conspiracy'
        ]
    
    def score_message(self, message, session_id=None):
        """
        Score a student's message on empathy, accuracy, and clarity.
        
        Args:
            message: The student's message to score
            session_id: Optional session ID for context
            
        Returns:
            dict: Scores for empathy, accuracy, and clarity (0-1 scale)
        """
        if not message or not message.strip():
            return {
                'empathy': 0.0,
                'accuracy': 0.0,
                'clarity': 0.0,
                'details': {}
            }
        
        empathy_score = self._score_empathy(message)
        accuracy_score = self._score_accuracy(message)
        clarity_score = self._score_clarity(message)
        
        return {
            'empathy': round(empathy_score, 2),
            'accuracy': round(accuracy_score, 2),
            'clarity': round(clarity_score, 2),
            'details': {
                'word_count': len(message.split()),
                'has_question': '?' in message,
                'sentiment': self._get_sentiment(message)
            }
        }
    
    def _score_empathy(self, message):
        """
        Score empathy based on keywords and sentiment.
        
        Returns:
            float: Empathy score (0-1)
        """
        message_lower = message.lower()
        score = 0.5  # Base score
        
        # Check for empathy keywords
        empathy_count = sum(1 for keyword in self.empathy_keywords 
                           if keyword.lower() in message_lower)
        
        # Boost score based on empathy keywords (up to 0.3)
        score += min(0.3, empathy_count * 0.1)
        
        # Check for personal pronouns indicating acknowledgment
        if any(phrase in message_lower for phrase in ['your concern', 'your worry', 'you feel', 'you\'re']):
            score += 0.15
        
        # Sentiment analysis - positive sentiment indicates empathetic tone
        sentiment = self.sia.polarity_scores(message)
        if sentiment['compound'] > 0.1:
            score += 0.1
        elif sentiment['compound'] < -0.1:
            score -= 0.15
        
        # Check for dismissive language (reduces empathy)
        dismissive_phrases = ['just', 'simply', 'you should', 'you must', 'you need to']
        if any(phrase in message_lower for phrase in dismissive_phrases):
            score -= 0.1
        
        # Questions can show engagement
        if '?' in message and 'why' not in message_lower:
            score += 0.05
        
        return max(0.0, min(1.0, score))
    
    def _score_accuracy(self, message):
        """
        Score accuracy based on factual content and absence of misinformation.
        
        Returns:
            float: Accuracy score (0-1)
        """
        message_lower = message.lower()
        score = 0.5  # Base score
        
        # Check for accurate information
        accurate_keywords = 0
        for category, keywords in self.accuracy_keywords.items():
            for keyword in keywords:
                if keyword.lower() in message_lower:
                    accurate_keywords += 1
        
        # Boost for accurate information (up to 0.4)
        score += min(0.4, accurate_keywords * 0.08)
        
        # Check for misinformation red flags
        misinformation_count = sum(1 for flag in self.misinformation_flags 
                                   if flag.lower() in message_lower)
        if misinformation_count > 0:
            score -= 0.3
        
        # Boost for mentioning specific data/numbers
        if re.search(r'\d+%|\d+ percent', message_lower) or 'study' in message_lower or 'trial' in message_lower:
            score += 0.15
        
        # Check for hedging language (shows appropriate caution)
        hedging = ['generally', 'typically', 'usually', 'most', 'many']
        if any(word in message_lower for word in hedging):
            score += 0.05
        
        return max(0.0, min(1.0, score))
    
    def _score_clarity(self, message):
        """
        Score clarity based on readability and structure.
        
        Returns:
            float: Clarity score (0-1)
        """
        score = 0.5  # Base score
        
        # Word count - should be substantial but not too long
        word_count = len(message.split())
        if 15 <= word_count <= 60:
            score += 0.2
        elif word_count < 10:
            score -= 0.2
        elif word_count > 100:
            score -= 0.15
        
        # Sentence count and structure
        sentences = message.split('.')
        sentence_count = len([s for s in sentences if s.strip()])
        
        if 1 <= sentence_count <= 4:
            score += 0.15
        elif sentence_count > 6:
            score -= 0.1
        
        # Check for proper sentence structure
        blob = TextBlob(message)
        if len(blob.sentences) > 0:
            score += 0.1
        
        # Jargon check - too much technical language reduces clarity
        jargon_terms = ['immunoglobulin', 'mRNA', 'adjuvant', 'epitope', 
                       'pathogen', 'antigen', 'cytokine']
        jargon_count = sum(1 for term in jargon_terms if term.lower() in message.lower())
        if jargon_count > 2:
            score -= 0.15
        elif jargon_count == 1:
            score += 0.05  # Some technical terms are good
        
        # Check for clarity indicators
        clarity_phrases = ['in other words', 'for example', 'this means', 
                          'let me explain', 'simply put']
        if any(phrase in message.lower() for phrase in clarity_phrases):
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    def _get_sentiment(self, message):
        """Get sentiment analysis of the message."""
        sentiment = self.sia.polarity_scores(message)
        return {
            'compound': round(sentiment['compound'], 2),
            'positive': round(sentiment['pos'], 2),
            'negative': round(sentiment['neg'], 2),
            'neutral': round(sentiment['neu'], 2)
        }
