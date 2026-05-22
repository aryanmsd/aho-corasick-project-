from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from aho_corasick import AhoCorasick

app = FastAPI()

# allow frontend on different port to call this api
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ac = AhoCorasick()


class KeywordsRequest(BaseModel):
    keywords: list[str]

class SearchRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "keywords_loaded": len(ac.keywords)
    }


@app.post("/keywords")
def add_keywords(request: KeywordsRequest):
    if not request.keywords:
        raise HTTPException(status_code=400, detail="Provide at least one keyword")
    
    ac.add_keywords(request.keywords)
    ac.build()
    
    return {
        "message": "Keywords added",
        "keywords": ac.keywords,
        "count": len(ac.keywords)
    }


@app.get("/keywords")
def get_keywords():
    return {"keywords": ac.keywords, "count": len(ac.keywords)}


@app.delete("/keywords")
def clear_keywords():
    ac.reset()
    return {"message": "All keywords cleared", "count": 0}


@app.post("/search")
def search(request: SearchRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if not ac.keywords:
        raise HTTPException(status_code=400, detail="No keywords loaded. Use POST /keywords first.")

    matches = ac.search(request.text)

    return {
        "matches": matches,
        "total_matches": len(matches),
        "unique_keywords_found": sorted(set(m["keyword"] for m in matches)),
        "text_length": len(request.text),
        "keywords_searched": len(ac.keywords)
    }