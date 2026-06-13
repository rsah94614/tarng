from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class EventBase(BaseModel):
    title: str = Field(..., max_length=255)
    start_time: datetime
    end_time: datetime
    location: str | None = Field(None, max_length=255)
    is_online: bool = False
    url: str | None = None


class EventCreate(EventBase):
    pass


class EventRSVPOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: str

    class Config:
        from_attributes = True


class EventOut(EventBase):
    id: int
    post_id: int
    going_count: int = 0
    maybe_count: int = 0
    user_rsvp: str | None = None

    class Config:
        from_attributes = True
