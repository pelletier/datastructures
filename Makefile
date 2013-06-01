deploy:
	rsync -rv --delete ./ ssh.pelletier.im:www/pelletier/lab/exec_js/
