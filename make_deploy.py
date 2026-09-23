# builds index.html (the standalone page Vercel serves) from game.html
src=open('game.html').read()
i=src.index('</style>')+len('</style>')
head=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
 '<meta name="description" content="A first-person walking tour of USC\'s University Park Campus.">\n'
 '<meta name="theme-color" content="#990000">\n'
 '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Ctext y=%2226%22 font-size=%2226%22%3E%F0%9F%8F%9B%3C/text%3E%3C/svg%3E">\n'
 '<link rel="preconnect" href="https://fonts.googleapis.com">\n')
out=head+src[:i]+'\n</head>\n<body>\n'+src[i:]+'\n</body>\n</html>\n'
open('index.html','w').write(out)
print(len(out), out.count('\n'))
