from datetime import datetime

from pydantic import BaseModel, Field


class PollOptionBase(BaseModel):
    text: str = Field(..., max_length=255)
    position: int = 0


class PollOptionCreate(PollOptionBase):
    pass


class PollOptionOut(PollOptionBase):
    id: int
    poll_id: int
    votes_count: int = 0
    has_voted: bool = False

    class Config:
        from_attributes = True


class PollBase(BaseModel):
    expires_at: datetime | None = None


class PollCreate(PollBase):
    options: list[PollOptionCreate] = Field(..., min_items=2)


class PollOut(PollBase):
    id: int
    post_id: int
    options: list[PollOptionOut]
    total_votes: int = 0
    has_voted: bool = False

    class Config:
        from_attributes = True
