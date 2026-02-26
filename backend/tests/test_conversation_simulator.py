"""
Tests for the Conversation Simulator module
"""

import unittest
import sys
import os
from unittest.mock import MagicMock, patch

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

    # ------------------------------------------------------------------
    # LLM persona tests
    # ------------------------------------------------------------------

    def _make_llm_response(self, text):
        """Helper: build a mock OpenAI chat completion response."""
        msg = MagicMock()
        msg.content = text
        choice = MagicMock()
        choice.message = msg
        completion = MagicMock()
        completion.choices = [choice]
        return completion

    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    @patch('modules.conversation_simulator.OpenAI')
    def test_llm_response_used_when_configured(self, mock_openai_cls):
        """When OPENAI_API_KEY is set the LLM client is used for patient responses."""
        llm_reply = "I'm still not convinced – what studies are you referring to?"
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = self._make_llm_response(llm_reply)
        mock_openai_cls.return_value = mock_client

        simulator = ConversationSimulator()
        self.assertIsNotNone(simulator._llm_client)

        session_id, _ = simulator.start_session('default')
        scores = {'empathy': 0.7, 'accuracy': 0.65, 'clarity': 0.7}
        response = simulator.get_response(session_id, "The vaccine is well-tested.", scores)

        self.assertEqual(response, llm_reply)
        mock_client.chat.completions.create.assert_called_once()

    def test_no_llm_client_without_api_key(self):
        """Without OPENAI_API_KEY the LLM client is None and rule-based is used."""
        env = {k: v for k, v in os.environ.items() if k != 'OPENAI_API_KEY'}
        with patch.dict(os.environ, env, clear=True):
            simulator = ConversationSimulator()
        self.assertIsNone(simulator._llm_client)

        session_id, _ = simulator.start_session('default')
        scores = {'empathy': 0.5, 'accuracy': 0.5, 'clarity': 0.5}
        response = simulator.get_response(session_id, "Vaccines are safe.", scores)
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)

    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    @patch('modules.conversation_simulator.OpenAI')
    def test_llm_failure_falls_back_to_rule_based(self, mock_openai_cls):
        """If the LLM raises an exception the rule-based response is returned."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = RuntimeError("API error")
        mock_openai_cls.return_value = mock_client

        simulator = ConversationSimulator()
        session_id, _ = simulator.start_session('default')
        scores = {'empathy': 0.5, 'accuracy': 0.5, 'clarity': 0.5}
        response = simulator.get_response(session_id, "Vaccines are safe.", scores)

        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)

    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    @patch('modules.conversation_simulator.OpenAI')
    def test_llm_system_prompt_reflects_persona(self, mock_openai_cls):
        """The system prompt passed to the LLM contains the persona details."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = self._make_llm_response("Hmm, okay.")
        mock_openai_cls.return_value = mock_client

        simulator = ConversationSimulator()
        session_id, _ = simulator.start_session('misinformation')
        scores = {'empathy': 0.5, 'accuracy': 0.5, 'clarity': 0.5}
        simulator.get_response(session_id, "Let me address your concerns.", scores)

        call_kwargs = mock_client.chat.completions.create.call_args
        messages = call_kwargs.kwargs.get('messages', call_kwargs.args[0] if call_kwargs.args else [])
        system_content = messages[0]['content']
        self.assertIn('Robert', system_content)
        self.assertIn('distrustful', system_content)

    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key', 'OPENAI_BASE_URL': 'http://localhost:11434/v1'})
    @patch('modules.conversation_simulator.OpenAI')
    def test_custom_base_url_passed_to_client(self, mock_openai_cls):
        """OPENAI_BASE_URL is forwarded to the OpenAI client constructor."""
        mock_openai_cls.return_value = MagicMock()
        ConversationSimulator()
        _, kwargs = mock_openai_cls.call_args
        self.assertEqual(kwargs.get('base_url'), 'http://localhost:11434/v1')


if __name__ == '__main__':
    unittest.main()
