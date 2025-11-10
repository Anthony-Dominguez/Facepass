"""
Quick integration test to verify face embedding encryption works end-to-end.
"""
import numpy as np
from app.services import embedding_storage

def test_encryption_roundtrip():
    """Test that encryption and decryption work correctly."""
    print("🧪 Testing Face Embedding Encryption Integration\n")

    # Generate a mock embedding (128 dimensions)
    print("1. Generating mock face embedding...")
    original_embedding = np.random.randn(128).tolist()
    print(f"   ✓ Generated {len(original_embedding)}-dimensional embedding")

    # Encrypt
    print("\n2. Encrypting embedding...")
    encrypted = embedding_storage.encrypt_embedding(original_embedding)
    print(f"   ✓ Encrypted to {len(encrypted)} character string")
    print(f"   ✓ Encrypted format: {encrypted[:50]}...")

    # Verify it's actually encrypted (not plain JSON)
    print("\n3. Verifying encryption...")
    assert encrypted != str(original_embedding), "Embedding is not encrypted!"
    assert "[" not in encrypted, "Encrypted string contains JSON brackets!"
    print("   ✓ Embedding is properly encrypted (not plain JSON)")

    # Decrypt
    print("\n4. Decrypting embedding...")
    decrypted = embedding_storage.decrypt_embedding(encrypted)
    print(f"   ✓ Decrypted to {len(decrypted)}-element list")

    # Verify correctness
    print("\n5. Verifying roundtrip correctness...")
    assert len(decrypted) == len(original_embedding), "Length mismatch!"

    # Check values are close (allowing for floating point precision)
    differences = [abs(a - b) for a, b in zip(original_embedding, decrypted)]
    max_diff = max(differences)
    print(f"   ✓ Max difference: {max_diff:.10f}")
    assert max_diff < 1e-10, f"Values don't match! Max diff: {max_diff}"

    print("\n✅ SUCCESS! Encryption/Decryption working correctly!")
    print("\n📋 Summary:")
    print(f"   • Original embedding: {len(original_embedding)} floats")
    print(f"   • Encrypted string: {len(encrypted)} characters")
    print(f"   • Decrypted embedding: {len(decrypted)} floats")
    print(f"   • Accuracy: Perfect match (max diff < 1e-10)")


def test_validation():
    """Test that validation catches invalid embeddings."""
    print("\n\n🧪 Testing Validation\n")

    # Test 1: Empty embedding
    print("1. Testing empty embedding...")
    try:
        embedding_storage.encrypt_embedding([])
        print("   ❌ Should have raised error!")
        assert False
    except ValueError as e:
        print(f"   ✓ Caught error: {e}")

    # Test 2: Too large embedding
    print("\n2. Testing oversized embedding (5000 dimensions)...")
    try:
        large_embedding = np.random.randn(5000).tolist()
        embedding_storage.encrypt_embedding(large_embedding)
        print("   ❌ Should have raised error!")
        assert False
    except ValueError as e:
        print(f"   ✓ Caught error: {e}")

    # Test 3: Invalid data type
    print("\n3. Testing invalid data type (contains string)...")
    try:
        invalid_embedding = [1.0, 2.0, "invalid", 4.0]
        embedding_storage.encrypt_embedding(invalid_embedding)
        print("   ❌ Should have raised error!")
        assert False
    except ValueError as e:
        print(f"   ✓ Caught error: {e}")

    print("\n✅ SUCCESS! Validation working correctly!")


def test_error_handling():
    """Test that decryption errors are handled gracefully."""
    print("\n\n🧪 Testing Error Handling\n")

    print("1. Testing decryption of invalid encrypted string...")
    try:
        embedding_storage.decrypt_embedding("invalid_encrypted_string")
        print("   ❌ Should have raised error!")
        assert False
    except ValueError as e:
        print(f"   ✓ Caught error: {e}")

    print("\n✅ SUCCESS! Error handling working correctly!")


if __name__ == "__main__":
    try:
        test_encryption_roundtrip()
        test_validation()
        test_error_handling()

        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED!")
        print("="*60)
        print("\nFace embedding encryption is working correctly and ready for production!")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        exit(1)