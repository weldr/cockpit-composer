eslint:
	npm run eslint

stylelint:
	npm run stylelint

unit-test:
	npm run test:cov

end-to-end-test:
	sudo docker build -f Dockerfile.nodejs --cache-from welder/web-nodejs:latest -t welder/web-nodejs:latest .

	sudo docker network create welder
	sudo docker build -t weld/web:latest .
	sudo docker build -f ./test/end-to-end/Dockerfile -t weld/end-to-end:latest ./test/end-to-end/

	wget https://s3.amazonaws.com/weldr/metadata.db
	sudo docker run -d --name api --restart=always -p 4000:4000 -v bdcs-recipes-volume:/bdcs-recipes -v `pwd`:/mddb --network welder --security-opt label=disable welder/bdcs-api-rs:latest
	sudo docker run -d --name web --restart=always -p 80:3000 --network welder weld/web:latest

	sudo docker run --rm --name welder_end_to_end --network welder \
	    -v test-result-volume:/result -v `pwd`:/mddb -e MDDB='/mddb/metadata.db' \
	    weld/end-to-end:latest \
	    xvfb-run -a -s '-screen 0 1024x768x24' npm run test
