all: chrome firefox

FILES=src/*.html src/*.js src/*.json src/lama2.png src/stop.png

chrome:
	mkdir -p dist/chrome ; \
	rm -f dist/chrome/* ; \
	cp $(FILES) dist/chrome ; \
	cp manifests/manifest.chrome.json dist/chrome/manifest.json ; \
	zip -r dist/chrome.zip dist/chrome

firefox:
	mkdir -p dist/firefox ; \
	rm -f dist/firefox/* ; \
	cp $(FILES) dist/firefox ; \
	cp manifests/manifest.firefox.json dist/firefox/manifest.json ; \
	web-ext build --overwrite-dest --source-dir dist/firefox --artifacts-dir dist

clean:
	rm -rf dist
