"""
Tests for the Feedback Generator module
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules.feedback_generator import FeedbackGenerator


class TestFeedbackGenerator(unittest.TestCase):
    def setUp(self):
        self.generator = FeedbackGenerator()
    
    def test_generate_feedback(self):
        """Test basic feedback generation"""
        message = "I understand your concerns about vaccine safety."
        scores = {
            'empathy': 0.75,
            'accuracy': 0.65,
            'clarity': 0.70
        }
        
        feedback = self.generator.generate_feedback(message, scores)
        
        self.assertIn('overall', feedback)
        self.assertIn('empathy', feedback)
        self.assertIn('accuracy', feedback)
        self.assertIn('clarity', feedback)
        self.assertIn('suggestions', feedback)
        self.assertIn('strengths', feedback)
    
    def test_high_score_feedback(self):
        """Test feedback for high scores"""
        message = "I understand your concerns. The vaccine has been tested extensively."
        scores = {
            'empathy': 0.85,
            'accuracy': 0.80,
            'clarity': 0.82
        }
        
        feedback = self.generator.generate_feedback(message, scores)
        
        self.assertIn('Excellent', feedback['overall'])
    
    def test_low_score_suggestions(self):
        """Test that low scores generate suggestions"""
        message = "Get vaccinated."
        scores = {
            'empathy': 0.3,
            'accuracy': 0.4,
            'clarity': 0.35
        }
        
        feedback = self.generator.generate_feedback(message, scores)
        
        self.assertGreater(len(feedback['suggestions']), 0)


if __name__ == '__main__':
    unittest.main()
