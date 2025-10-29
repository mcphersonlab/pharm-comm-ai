"""
Tests for the NLP Scorer module
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules.nlp_scorer import NLPScorer


class TestNLPScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = NLPScorer()
    
    def test_score_message_basic(self):
        """Test basic message scoring"""
        message = "I understand your concerns about vaccine safety."
        scores = self.scorer.score_message(message)
        
        self.assertIn('empathy', scores)
        self.assertIn('accuracy', scores)
        self.assertIn('clarity', scores)
        self.assertGreaterEqual(scores['empathy'], 0)
        self.assertLessEqual(scores['empathy'], 1)
    
    def test_empathy_scoring(self):
        """Test empathy scoring with empathetic message"""
        empathetic_msg = "I completely understand your worry. It's natural to have concerns about side effects."
        scores = self.scorer.score_message(empathetic_msg)
        
        self.assertGreater(scores['empathy'], 0.5)
    
    def test_accuracy_scoring(self):
        """Test accuracy scoring with factual information"""
        accurate_msg = "Clinical trials with over 30,000 participants showed the vaccine is safe and effective."
        scores = self.scorer.score_message(accurate_msg)
        
        self.assertGreater(scores['accuracy'], 0.5)
    
    def test_empty_message(self):
        """Test handling of empty messages"""
        scores = self.scorer.score_message("")
        
        self.assertEqual(scores['empathy'], 0.0)
        self.assertEqual(scores['accuracy'], 0.0)
        self.assertEqual(scores['clarity'], 0.0)


if __name__ == '__main__':
    unittest.main()
