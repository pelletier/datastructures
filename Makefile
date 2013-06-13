.PHONY: assets

all: install

deps:
	npm install
	bower install

assets:
	grunt build
	mkdir -p assets/
	cp -R _build/* assets/

clean:
	rm -Rf assets _build output components

compile:
	nanoc compile

watch:
	bundle exec guard

deploy: install
	mkdir -p /tmp/datastructures
	cp -R output/* /tmp/datastructures
	rm -Rf /tmp/datastructures/output
	rm -Rf /tmp/datastructures/tmp
	git checkout gh-pages
	rm -Rf *
	mv /tmp/datastructures/* .
	git add .
	git commit -a -m "deploy `date`"
	git push origin gh-pages
	git checkout master

push: deploy
	git push origin master

test:
	grunt test

install: deps assets compile
