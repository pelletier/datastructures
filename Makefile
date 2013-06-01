deploy:
	rsync -rv --delete ./ ssh.pelletier.im:www/pelletier/lab/exec_js/

push: deploy
	git push origin master
