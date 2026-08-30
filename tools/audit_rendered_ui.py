"""Report Czech text that remains visible in a rendered Aurora DOM."""

import re
import sys
from html.parser import HTMLParser


CZECH = re.compile(
    r"[ěščřžýáíéúůďťňĚŠČŘŽÝÁÍÉÚŮĎŤŇ]"
    r"|\b(?:Vypnuto|Zapnuto|Vrstva|Nastaveni|Prehravac|Dalsi|Predchozi|"
    r"Kopirovat|Vlozit|Celkem|Jazyk|Dnes|Vcera|Zatim|Zadne|Hotovo)\b",
    re.IGNORECASE,
)


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.items = set()

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.skip += 1
        if self.skip:
            return
        for key, value in attrs:
            if key in {"title", "placeholder", "aria-label"} and value and CZECH.search(value):
                self.items.add(value.strip())

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if self.skip:
            return
        value = " ".join(data.split())
        if value and CZECH.search(value):
            self.items.add(value)


parser = VisibleText()
parser.feed(sys.stdin.read())
for item in sorted(parser.items, key=str.casefold):
    print(item)
sys.exit(1 if parser.items else 0)
