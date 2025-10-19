from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, Response

from ..core.templates import templates

router = APIRouter()

FAVICON_SVG = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
<rect width='64' height='64' rx='12' fill='#2563eb'/>
<path d='M20 44l12-24 12 24' stroke='#fff' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>
</svg>"""


@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/favicon.ico", include_in_schema=False)
async def favicon() -> Response:
    return Response(content=FAVICON_SVG, media_type="image/svg+xml")
