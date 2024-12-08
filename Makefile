all: chrome firefox

chrome:
	mkdir -p dist/chrome ; \
	rm -f dist/chrome/* ; \
	cp -r src/* dist/chrome ; \
	cp manifests/manifest.chrome.json dist/chrome/manifest.json ; \
	zip -r dist/chrome.zip dist/chrome

firefox:
	mkdir -p dist/firefox ; \
	rm -f dist/firefox/* ; \
	cp -r src/* dist/firefox ; \
	cp manifests/manifest.firefox.json dist/firefox/manifest.json ; \
	web-ext build --overwrite-dest --source-dir dist/firefox --artifacts-dir dist

clean:
	rm -rf dist
