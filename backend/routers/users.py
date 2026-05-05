from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def get_users():
    return [{"id": 1, "username": "admin", "email": "admin@rocketlab.com"}]

@router.post("/")
def create_user():
    return {"message": "User created successfully"}
