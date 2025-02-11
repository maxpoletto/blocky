all: chrome firefox

FILES=src/background.js src/blocked.html src/lama2.png src/options.html src/options.js src/rules.json src/stop.png
MANIFEST_CHROME=src/manifest.chrome.json
MANIFEST_FIREFOX=src/manifest.firefox.json

chrome: $(FILES)
	mkdir -p dist/chrome ; \
	rm -f dist/chrome/* ; \
	cp $(FILES) dist/chrome ; \
	cp $(MANIFEST_CHROME) dist/chrome/manifest.json ; \
	cd dist/chrome && zip -r ../chrome.zip .

firefox: $(FILES)
	mkdir -p dist/firefox ; \
	rm -f dist/firefox/* ; \
	cp $(FILES) dist/firefox ; \
	cp $(MANIFEST_FIREFOX) dist/firefox/manifest.json ; \
	web-ext build --overwrite-dest --source-dir dist/firefox --artifacts-dir dist

clean:
	rm -rf dist

.PHONY: all chrome firefox clean
