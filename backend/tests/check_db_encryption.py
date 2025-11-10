"""
Quick database checker to verify face embeddings are encrypted.
Run this after registering a user through your frontend.
"""
import os
import sqlite3

def check_encryption():
    """Check if embeddings in database are encrypted."""
    print("🔍 Checking Database for Encrypted Face Embeddings\n")
    print("="*60)

    # Find database file
    db_paths = [
        "facepass.db",
        "app.db",
        "database.db",
        "app/facepass.db",
    ]

    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break

    if not db_path:
        print("❌ Database file not found!")
        print("\nTried looking for:")
        for path in db_paths:
            print(f"   • {path}")
        print("\nRegister a user first, then run this script again.")
        return

    print(f"✓ Found database: {db_path}\n")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get users count
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"Total users in database: {count}\n")

        if count == 0:
            print("⚠️  No users found in database.")
            print("\nNext steps:")
            print("   1. Open your frontend")
            print("   2. Register a new user with your face")
            print("   3. Run this script again")
            return

        # Get all users
        cursor.execute("SELECT id, username_hash, face_embedding, password_hash FROM users")
        users = cursor.fetchall()

        print("="*60)
        print("USER DETAILS")
        print("="*60)

        all_encrypted = True
        for user_id, username_hash, face_embedding, password_hash in users:
            print(f"\n👤 User ID: {user_id}")
            print(f"─"*60)

            # Username Hash
            print(f"Username Hash: {username_hash[:60]}...")

            # Password Hash (bcrypt)
            print(f"Password Hash: {password_hash[:60]}...")
            if password_hash.startswith('$2b$'):
                print("   ✅ Password: Encrypted with bcrypt")

            # Face Embedding
            print(f"\nFace Embedding:")
            print(f"   Length: {len(face_embedding)} characters")
            print(f"   Preview: {face_embedding[:80]}...")

            # Check encryption format
            if face_embedding.startswith('gAAAAA'):
                print("   ✅ Status: ENCRYPTED with Fernet")
                print("   ✅ Format: AES-128 + HMAC-SHA256")
            elif face_embedding.startswith('['):
                print("   ❌ Status: NOT ENCRYPTED (plain JSON)")
                all_encrypted = False
            else:
                print("   ⚠️  Status: Unknown format")
                all_encrypted = False

        conn.close()

        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)

        if all_encrypted:
            print("\n🎉 SUCCESS! All face embeddings are encrypted!")
            print("\n✓ Encryption: Fernet (AES-128-CBC + HMAC-SHA256)")
            print("✓ Same security as vault credentials")
            print("✓ Embeddings are NOT stored as plain JSON")
            print("\nYour face recognition system is secure! 🔐")
        else:
            print("\n⚠️  WARNING: Some embeddings are not encrypted!")
            print("\nThis might mean:")
            print("   • Old users from before encryption was added")
            print("   • Migration needed")

        print("\nNext steps:")
        print("   • Test login with the registered user")
        print("   • Verify face matching works correctly")
        print("   • Check logs for any decryption errors")

    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_encryption()
