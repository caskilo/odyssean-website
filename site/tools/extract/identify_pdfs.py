"""Identify each cached PDF: first-page text, page count, md5, PDF metadata.
Dev-time verification aid for build-plan task 1.5 (needs PyMuPDF: `pip install pymupdf`).
Writes tools/.cache/pdfs/pdf-identity.json."""
import hashlib, json, pathlib, re, sys
import fitz

d = pathlib.Path(__file__).resolve().parent.parent / '.cache' / 'pdfs'
out = {}
for f in sorted(d.glob('*.pdf')):
    doc = fitz.open(f)
    first = re.sub(r'\s+', ' ', doc[0].get_text()).strip()
    out[f.stem] = {
        'pages': doc.page_count,
        'md5': hashlib.md5(f.read_bytes()).hexdigest(),
        'bytes': f.stat().st_size,
        'metaTitle': (doc.metadata or {}).get('title') or None,
        'firstPage': first[:300],
    }
(d / 'pdf-identity.json').write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
for k, v in out.items():
    print(f"{k}  p={v['pages']:<3} md5={v['md5'][:8]}  meta={v['metaTitle']!r}\n    {v['firstPage'][:160]}")
