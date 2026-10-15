"""Lift concept SVG artwork into src/art/<key>/ (build-plan C.4). One-off provenance script.
Reads the unpacked concept slides in $TEMP/concepts (see docs/new-design/extracted/README.md)."""
import json, os, re, sys

TEMP = os.environ.get('TEMP', '/tmp')
ART = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'art')


def slide(prefix):
    d = next(x for x in os.listdir(os.path.join(TEMP, 'concepts')) if x.startswith(prefix) and os.path.isdir(os.path.join(TEMP, 'concepts', x)))
    s = open(os.path.join(TEMP, 'concepts', d, 'index.html'), encoding='utf-8').read()
    return s[s.find('<x-dc'):]


def svgs(prefix):
    return re.findall(r'<svg.*?</svg>', slide(prefix), re.S)


def fix(svg):
    svg = re.sub(r'\bsc-camel-view-box=', 'viewBox=', svg)
    svg = re.sub(r'\bsc-camel-preserve-aspect-ratio=', 'preserveAspectRatio=', svg)
    svg = re.sub(r'\bsc-camel-pattern-units=', 'patternUnits=', svg)
    svg = re.sub(r'\bsc-camel-pattern-transform=', 'patternTransform=', svg)
    svg = re.sub(r'></(path|circle|ellipse|rect)>', r' />', svg)
    return svg


def write(key, astro, meta):
    d = os.path.join(ART, key)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'Art.astro'), 'w', encoding='utf-8').write(astro)
    open(os.path.join(d, 'meta.json'), 'w', encoding='utf-8').write(json.dumps(meta, indent=2) + '\n')
    print('wrote', key)


FINAL = lambda src, notes='': {'status': 'final', 'source': src, 'mobile': 'scales', **({'notes': notes} if notes else {})}

# Projects panel marks (slide 05): wheat, sunrise, ring of nodes
for key, i in (('mark-grain', 0), ('mark-scans', 1), ('mark-process', 2)):
    inner = re.search(r'<g.*</g>', fix(svgs('05')[i]), re.S).group(0)
    write(key, f'<svg class="art" viewBox="0 0 100 100" aria-hidden="true">{inner}</svg>\n\n<style>\n  .art {{\n    width: 4.5rem;\n    height: 4.5rem;\n  }}\n</style>\n',
          FINAL('concept slide 05', 'Icon for the Projects panel; stroke colour is part of the artwork.'))

# Portrait silhouettes (slide 08)
for key, i in (('portrait-expert-a', 0), ('portrait-citizen-a', 1), ('portrait-citizen-b', 2), ('portrait-expert-b', 3)):
    inner = re.search(r'<circle.*</svg>', fix(svgs('08')[i]), re.S).group(0)[:-len('</svg>')]
    write(key, f'<svg class="art" viewBox="0 0 120 150" aria-hidden="true">{inner}</svg>\n\n<style>\n  .art {{\n    display: block;\n    width: 100%;\n    height: 100%;\n  }}\n</style>\n',
          FINAL('concept slide 08', 'Silhouette placeholder in the concept itself; swap for photographs when assembly members are known.'))

# Venn (slide 10): labels become props
v = fix(svgs('10')[0])
v = re.sub(r'role="img" aria-label="[^"]*"', 'role="img" aria-label={description}', v)
v = v.replace('style="width: 100%; height: auto; display: block"', 'class="art"')
v = v.replace('>Odyssean</text>', '>{center}</text>')
v = v.replace('>NATURAL SCIENCES</text>', '>{left}</text>').replace('>SOCIAL SCIENCES</text>', '>{right}</text>')
v = re.sub(r'(<g font-family="\'DM Mono\', monospace")', r'\1 style="text-transform: uppercase"', v)
write('origin-venn',
      "---\ninterface Props {\n  labels: [string, string, string];\n  description: string;\n}\nconst {\n  labels: [left, right, center],\n  description,\n} = Astro.props;\n---\n\n" + v + "\n\n<style>\n  .art {\n    display: block;\n    width: 100%;\n    height: auto;\n  }\n</style>\n",
      FINAL('concept slide 10', 'Labels and description come from content (about.origin.figure).'))
