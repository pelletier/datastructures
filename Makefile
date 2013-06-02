all: compile

compile:
	nanoc compile

view: compile
	nanoc view

watch:
	nanoc watch &
	nanoc view

deploy: compile
	mkdir -p /tmp/exec_js
	cp -R ouput/* /tmp/exec_js
	rm /tmp/exec_js/Makefile
	git checkout gh-pages
	rm -Rf *
	mv /tmp/exec_js/* .
	git add .
	git commit -a -m "deploy `date`"
	git push origin gh-pages
	git checkout master

push: deploy
	git push origin master
