from pydantic import BaseModel
from typing import List, Optional


class DeleteSummaryModel(BaseModel):
    server: str = "global"
    season: int
    tag: str = ""
    atk_sig: str
    def_sig: str


class BatchDeleteRequest(BaseModel):
    items: List[DeleteSummaryModel]


class ManualAddRequest(BaseModel):
    server: str = "global"
    season: int
    tag: str = ""
    atk_team: List[int]
    def_team: List[int]
    wins: int
    losses: int


class CommentRequest(BaseModel):
    server: str = "global"
    atk_sig: str
    def_sig: str
    username: str = "Sensei"
    content: str
    parent_id: Optional[int] = None
