from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/users/me") 
# For duplicate paths, it always uses 
async def read_user_me():
    return {"user_id": "the current user"}


@app.get("/users/{user_id}")
# Defines it to only be an str and not an int or anything else
async def read_user(user_id: str): 
    return {"user_id": user_id}

@app.get("/items/{item_id}") 
#If you set this parameter in the function to be an int,then the item id will only be able to be an integer
async def read_item(item_id): 
    return {"item_id": item_id}