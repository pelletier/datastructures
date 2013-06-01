deploy:
	rsync -rv --stats --progress --delete --exclude '.git' ./ ssh.pelletier.im:www/pelletier/lab/exec_js/

push: deploy
	git push origin master
