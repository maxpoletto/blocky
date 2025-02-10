all: chrome firefox

FILES=src/*.html src/*.js src/*.json src/lama2.png src/stop.png

chrome: $(FILES)
	mkdir -p dist/chrome ; \
	rm -f dist/chrome/* ; \
	cp $(FILES) dist/chrome ; \
	cp manifests/manifest.chrome.json dist/chrome/manifest.json ; \
	cd dist/chrome && zip -r ../chrome.zip .

firefox: $(FILES)
	mkdir -p dist/firefox ; \
	rm -f dist/firefox/* ; \
	cp $(FILES) dist/firefox ; \
	cp manifests/manifest.firefox.json dist/firefox/manifest.json ; \
	web-ext build --overwrite-dest --source-dir dist/firefox --artifacts-dir dist

clean:
	rm -rf dist

.PHONY: all chrome firefox clean
