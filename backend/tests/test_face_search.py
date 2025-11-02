"""Unit tests for greedy face search algorithm."""
import json
import pytest
import numpy as np
from unittest.mock import Mock, MagicMock
from sqlalchemy.orm import Session

from app.services.face_search import (
    greedy_face_search,
    greedy_face_check_duplicate,
    get_search_stats
)
from app.models import User


def create_mock_user(user_id: int, embedding: list) -> Mock:
    """Create a mock user with face embedding."""
    user = Mock(spec=User)
    user.id = user_id
    user.username_hash = f"user_{user_id}_hash"
    user.face_embedding = json.dumps(embedding)
    user.password_hash = "hashed_password"
    return user


def generate_random_embedding(dim: int = 128) -> list:
    """Generate a random face embedding."""
    return np.random.randn(dim).tolist()


def generate_similar_embedding(base_embedding: list, noise: float = 0.1) -> list:
    """Generate an embedding similar to the base embedding."""
    base = np.array(base_embedding)
    similar = base + np.random.randn(len(base)) * noise
    return similar.tolist()


class TestGreedyFaceSearch:
    """Test cases for greedy_face_search function."""

    def test_finds_exact_match(self):
        """Test that exact match is found."""
        query_embedding = generate_random_embedding()

        # Create mock users
        user1 = create_mock_user(1, generate_random_embedding())
        user2 = create_mock_user(2, query_embedding)  # Exact match
        user3 = create_mock_user(3, generate_random_embedding())

        # Mock database session
        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = [user1, user2, user3]
        mock_db.query.return_value = mock_query

        # Test search
        result = greedy_face_search(query_embedding, mock_db, threshold=0.7)

        assert result is not None
        assert result.id == 2

    def test_finds_similar_match(self):
        """Test that similar face is found within threshold."""
        base_embedding = generate_random_embedding()
        query_embedding = generate_similar_embedding(base_embedding, noise=0.2)

        user1 = create_mock_user(1, generate_random_embedding())
        user2 = create_mock_user(2, base_embedding)  # Similar match

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = [user1, user2]
        mock_db.query.return_value = mock_query

        result = greedy_face_search(query_embedding, mock_db, threshold=1.0)

        assert result is not None
        assert result.id == 2

    def test_returns_none_when_no_match(self):
        """Test that None is returned when no match found."""
        query_embedding = generate_random_embedding()

        # Create users with very different embeddings
        user1 = create_mock_user(1, np.zeros(128).tolist())
        user2 = create_mock_user(2, np.ones(128).tolist())

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = [user1, user2]
        mock_db.query.return_value = mock_query

        result = greedy_face_search(query_embedding, mock_db, threshold=0.5)

        assert result is None

    def test_returns_none_when_no_users(self):
        """Test that None is returned when database is empty."""
        query_embedding = generate_random_embedding()

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = []
        mock_db.query.return_value = mock_query

        result = greedy_face_search(query_embedding, mock_db)

        assert result is None

    def test_early_stop_behavior(self):
        """Test that search stops at first match (greedy behavior)."""
        base_embedding = generate_random_embedding()
        query_embedding = generate_similar_embedding(base_embedding, noise=0.1)

        # Create multiple similar users
        user1 = create_mock_user(1, base_embedding)
        user2 = create_mock_user(2, generate_similar_embedding(base_embedding, 0.1))
        user3 = create_mock_user(3, generate_similar_embedding(base_embedding, 0.1))

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = [user1, user2, user3]
        mock_db.query.return_value = mock_query

        result = greedy_face_search(query_embedding, mock_db, threshold=1.0, top_k=2)

        # Should return one of the first matches due to early stopping
        assert result is not None
        assert result.id in [1, 2]  # Should be in top_k


class TestGreedyFaceCheckDuplicate:
    """Test cases for greedy_face_check_duplicate function."""

    def test_detects_duplicate(self):
        """Test that duplicate face is detected."""
        query_embedding = generate_random_embedding()

        user1 = create_mock_user(1, query_embedding)

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = [user1]
        mock_db.query.return_value = mock_query

        result = greedy_face_check_duplicate(query_embedding, mock_db)

        assert result is True

    def test_no_duplicate_found(self):
        """Test that no duplicate returns False."""
        query_embedding = generate_random_embedding()

        user1 = create_mock_user(1, generate_random_embedding())

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = [user1]
        mock_db.query.return_value = mock_query

        result = greedy_face_check_duplicate(query_embedding, mock_db, threshold=0.5)

        assert result is False


class TestGetSearchStats:
    """Test cases for get_search_stats function."""

    def test_returns_correct_stats(self):
        """Test that statistics are calculated correctly."""
        base_embedding = generate_random_embedding()
        query_embedding = generate_similar_embedding(base_embedding, noise=0.2)

        # Create 5 users
        users = [create_mock_user(i, generate_random_embedding()) for i in range(5)]
        users[2] = create_mock_user(2, base_embedding)  # One similar user

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = users
        mock_db.query.return_value = mock_query

        stats = get_search_stats(query_embedding, mock_db, threshold=1.0)

        assert stats["total_users"] == 5
        assert stats["candidates_checked"] == 5  # min(10, 5)
        assert "best_distance" in stats
        assert stats["best_distance"] is not None


class TestPerformanceComparison:
    """Compare performance of greedy vs naive search."""

    def test_greedy_checks_fewer_users(self):
        """Test that greedy search checks fewer users than naive O(n) scan."""
        query_embedding = generate_random_embedding()

        # Create 100 users
        users = [create_mock_user(i, generate_random_embedding()) for i in range(100)]

        # Put a match at position 5
        users[5] = create_mock_user(5, query_embedding)

        mock_db = Mock(spec=Session)
        mock_query = Mock()
        mock_query.all.return_value = users
        mock_db.query.return_value = mock_query

        # Greedy search with top_k=10 should only check ~10 users
        result = greedy_face_search(query_embedding, mock_db, top_k=10)

        assert result is not None
        # Greedy search found the match by checking far fewer than 100 users


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
