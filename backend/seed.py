import os
import sys

# Ensure backend directory is in the python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal
from app.models.community import Community, CommunityMember
from app.models.community_section import CommunitySection
from app.models.community_template import CommunityTemplate
from app.schemas.post import CommentCreate, PostCreate
from app.schemas.user import UserCreate
from app.services import community_service, post_service, user_service


def seed():
    db = SessionLocal()

    try:
        # 1. Ensure templates exist
        templates_data = [
            {
                "name": "Developer",
                "description": "For software developers and tech communities",
                "icon": "code",
                "is_system": True,
                "sections": [
                    {"name": "Resources", "section_type": "resources", "icon": "library"},
                    {"name": "Projects", "section_type": "feed", "icon": "folder-git-2"},
                    {"name": "Jobs", "section_type": "feed", "icon": "briefcase"},
                ],
            },
            {
                "name": "School",
                "description": "For schools, colleges, and academic groups",
                "icon": "graduation-cap",
                "is_system": True,
                "sections": [
                    {"name": "Announcements", "section_type": "announcements", "icon": "megaphone"},
                    {"name": "Study Materials", "section_type": "resources", "icon": "book-open"},
                    {"name": "Events", "section_type": "feed", "icon": "calendar"},
                ],
            },
        ]

        for t_data in templates_data:
            existing = db.query(CommunityTemplate).filter(CommunityTemplate.name == t_data["name"]).first()
            if not existing:
                print(f"Creating template {t_data['name']}...")
                community_service.create_template(
                    db,
                    name=str(t_data["name"]),
                    description=str(t_data["description"]),
                    icon=str(t_data["icon"]),
                    sections=list(t_data["sections"]),  # type: ignore
                    is_system=bool(t_data["is_system"]),
                )

        dev_template = db.query(CommunityTemplate).filter(CommunityTemplate.name == "Developer").first()

        # 2. Check if users already exist
        alice = user_service.get_user_by_username(db, "alice")
        bob = user_service.get_user_by_username(db, "bob")

        if not alice:
            print("Creating user alice...")
            alice = user_service.create_user(
                db,
                UserCreate(
                    username="alice",
                    email="alice@example.com",
                    password="Password123!",
                    display_name="Alice Wonderland",
                ),
            )

        if not bob:
            print("Creating user bob...")
            bob = user_service.create_user(
                db,
                UserCreate(
                    username="bob",
                    email="bob@example.com",
                    password="Password123!",
                    display_name="Bob Builder",
                ),
            )

        # 3. Check if root community exists
        root_wave = db.query(Community).filter(Community.name == "Developers Global").first()
        if not root_wave:
            print("Creating root wave 'Developers Global'...")
            from app.schemas.community import CommunityCreate
            root_wave = community_service.create_community(
                db,
                CommunityCreate(
                    name="Developers Global",
                    description="A global wave for all developers.",
                    is_public=True,
                    template_id=dev_template.id if dev_template else None,
                ),
                creator_id=alice.id,
            )

            # Join bob
            community_service.join_community(db, root_wave.id, bob.id)

            # Create a child wave (e.g. Frontend)
            print("Creating child wave 'Frontend'...")
            frontend_wave = community_service.create_community(
                db,
                CommunityCreate(
                    name="Frontend",
                    description="Everything about frontend development.",
                    is_public=True,
                    parent_id=root_wave.id,
                ),
                creator_id=alice.id,
            )
            community_service.join_community(db, frontend_wave.id, bob.id)

            # Create a grandchild wave (e.g. React)
            print("Creating grandchild wave 'React'...")
            react_wave = community_service.create_community(
                db,
                CommunityCreate(
                    name="React",
                    description="React.js library discussion.",
                    is_public=True,
                    parent_id=frontend_wave.id,
                ),
                creator_id=alice.id,
            )
            community_service.join_community(db, react_wave.id, bob.id)

            # 4. Create sample posts in specific sections
            print("Creating sample posts...")
            # Alice posts in 'Developers Global' Feed
            feed_section = db.query(CommunitySection).filter(
                CommunitySection.community_id == root_wave.id,
                CommunitySection.section_type == "feed"
            ).first()

            if feed_section:
                post1 = post_service.create_post(
                    db,
                    PostCreate(
                        content="Welcome to the global developers wave! Feel free to explore the sub-waves.",
                        community_id=root_wave.id,
                        section_id=feed_section.id,
                    ),
                    author_id=alice.id,
                )

                # Bob replies
                post_service.create_comment(
                    db,
                    post_id=post1.id,
                    payload=CommentCreate(content="Glad to be here!"),
                    author_id=bob.id,
                )

            # Bob posts in 'React' Feed
            react_feed = db.query(CommunitySection).filter(
                CommunitySection.community_id == react_wave.id,
                CommunitySection.section_type == "feed"
            ).first()

            if react_feed:
                post_service.create_post(
                    db,
                    PostCreate(
                        content="Has anyone tried React 19 yet? The new hooks look amazing.",
                        community_id=react_wave.id,
                        section_id=react_feed.id,
                    ),
                    author_id=bob.id,
                )

            print("Seed complete! Created templates, nested waves, and posts.")
        else:
            print("Data already exists. Skipping seed.")

        print("\nYou can now login with:")
        print("Email: alice@example.com / bob@example.com")
        print("Password: Password123!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
