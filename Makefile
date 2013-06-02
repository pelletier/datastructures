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
	cp -R output/* /tmp/exec_js
	rm -Rf /tmp/exec_js/output
	rm -Rf /tmp/exec_js/tmp
	git checkout gh-pages
	rm -Rf *
	mv /tmp/exec_js/* .
	git add .
	git commit -a -m "deploy `date`"
	git push origin gh-pages
	git checkout master

push: deploy
	git push origin master
