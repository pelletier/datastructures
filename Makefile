deploy:
	mkdir -p /tmp/exec_js
	cp -R * /tmp/exec_js
	rm /tmp/exec_js/Makefile
	git checkout gh-pages
	mv /tmp/exec-js/* .
	git push origin gh-pages
	git checkout master

push: deploy
	git push origin master
