# Start with the ui
cd ui

# Change url to "." in ui server settings
nano ./src/app/serverSlice.ts

# Build the ui
npm run build

# Move the ui artifacts into the api
cd ../api
cp -r ../ui/build/* ./src/main/resources/static

# Change the location of the database to /data/database.db
nano ./src/main/resources/application.properties

# Build the api
./gradlew build

# Build a docker image
docker build .

# Optional push image
docker tag <id> d3v01d/simplefinance:latest
docker push d3v01d/simplefinance:latest
docker tag <id> d3v01d/simplefinance:stable
docker push d3v01d/simplefinance:stable


# Revert the url
git checkout ../ui/src/app/serverSlice.ts

# Revert the db
git checkout ./src/main/resources/application.properties

# Remove the built artifacts
rm -rf ./src/main/resources/static/*
