all: compile

compile:
	nanoc compile

view: compile
	nanoc view

watch:
	nanoc watch &
	nanoc view

deploy: compile
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
