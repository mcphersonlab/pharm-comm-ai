"""
Tests for the Conversation Simulator module
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules.conversation_simulator import ConversationSimulator


class TestConversationSimulator(unittest.TestCase):
    def setUp(self):
        self.simulator = ConversationSimulator()
    
    def test_start_session(self):
        """Test starting a new session"""
        session_id, initial_message = self.simulator.start_session('default')
        
        self.assertIsNotNone(session_id)
        self.assertIsInstance(initial_message, str)
        self.assertIn(session_id, self.simulator.sessions)
    
    def test_get_response(self):
        """Test getting a patient response"""
        session_id, _ = self.simulator.start_session('default')
        
        student_message = "I understand your concerns about side effects."
        scores = {'empathy': 0.8, 'accuracy': 0.7, 'clarity': 0.75}
        
        response = self.simulator.get_response(session_id, student_message, scores)
        
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)
    
    def test_end_session(self):
        """Test ending a session"""
        session_id, _ = self.simulator.start_session('default')
        
        # Send a few messages
        student_message = "I understand your concerns."
        scores = {'empathy': 0.8, 'accuracy': 0.7, 'clarity': 0.75}
        self.simulator.get_response(session_id, student_message, scores)
        
        summary = self.simulator.end_session(session_id)
        
        self.assertIsInstance(summary, dict)
        self.assertIn('duration_minutes', summary)
        self.assertIn('turn_count', summary)
        self.assertIn('average_scores', summary)
        self.assertNotIn(session_id, self.simulator.sessions)


if __name__ == '__main__':
    unittest.main()
