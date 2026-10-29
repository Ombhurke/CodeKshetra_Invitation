from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).parent
dest = root / 'dist' / 'codekshetra-source.zip'
files = [root / name for name in ['README.md', 'PROJECT_CONTEXT.md', 'package.json', 'create-pages.py', 'bundle-source.py']]
files += [p for p in (root / 'dist').iterdir() if p.suffix in ('.html', '.js', '.css', '.svg') and not p.name.startswith('qa-')]
with ZipFile(dest, 'w', ZIP_DEFLATED) as bundle:
    for file in files:
        bundle.write(file, Path('codekshetra-invitations') / file.relative_to(root))
print(f'Packaged {len(files)} files, {dest.stat().st_size} bytes.')
