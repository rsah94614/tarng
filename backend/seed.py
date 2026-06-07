import os
import sys

# Ensure backend directory is in the python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal
from app.schemas.user import UserCreate
from app.schemas.post import PostCreate, CommentCreate
from app.models.community import Community
from app.services import user_service, post_service

def seed():
    db = SessionLocal()
    
    try:
        # Check if users already exist
        alice = user_service.get_user_by_username(db, "alice")
        bob = user_service.get_user_by_username(db, "bob")
        
        if not alice:
            print("Creating user alice...")
            alice = user_service.create_user(db, UserCreate(
                username="alice",
                email="alice@example.com",
                password="Password123!",
                display_name="Alice Wonderland"
            ))
            
        if not bob:
            print("Creating user bob...")
            bob = user_service.create_user(db, UserCreate(
                username="bob",
                email="bob@example.com",
                password="Password123!",
                display_name="Bob Builder"
            ))

        # Check if community exists
        community = db.query(Community).filter(Community.name == "Developers").first()
        if not community:
            print("Creating community Developers...")
            community = Community(
                name="Developers",
                slug="developers",
                description="A wave for all coders to share tips and projects.",
                created_by_id=alice.id
            )
            db.add(community)
            db.commit()
            db.refresh(community)

        # Check if posts exist
        posts, _ = post_service.get_feed(db, current_user_id=alice.id, limit=5)
        if len(posts) == 0:
            print("Creating sample posts...")
            # Alice creates a post in Developers community
            post1 = post_service.create_post(db, PostCreate(
                content="Hello everyone! This is my first post on the new platform! Let me know what you think.",
                community_id=community.id
            ), author_id=alice.id)
            
            # Bob creates a global post
            post2 = post_service.create_post(db, PostCreate(
                content="Just set up my local environment. Everything is running smoothly!"
            ), author_id=bob.id)
            
            # Bob replies to Alice
            post_service.create_comment(db, post_id=post1.id, payload=CommentCreate(
                content="Welcome Alice! Glad you are here."
            ), author_id=bob.id)
            
            # Alice replies to Bob
            post_service.create_comment(db, post_id=post2.id, payload=CommentCreate(
                content="Great job Bob. Hit me up if you need help with anything."
            ), author_id=alice.id)
            
            print("Seed complete! Created posts and comments.")
        else:
            print("Data already exists. Skipping seed.")

        print("\nYou can now login with:")
        print("Email: alice@example.com / bob@example.com")
        print("Password: Password123!")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed()
