## Important
`jest` uses modules that are implemented as CommonJS. However `kubernetes-client` is developed in typescript.

To use ES modules, two things are required 
1: Use `babel-jest`. Create [babel config](./babel.config.js) and export the defaults.
2: Add the below block to `package.json``
```javascript
"type": "module",
  "jest": {
    "transform": {
      "^.+\\.jsx?$": "babel-jest"
    },
    "transformIgnorePatterns": [
      "node_modules/(?!(@kubernetes/client-node|openid-client|oauth4webapi)/.*)"
    ]
```
Note: Adjust the node_modules as needed but adding any clients that throw an export error to it.

# Build project
```commandline
make build
```

# Test
```commandline
make test
```

# Reports
The reports are pushed to `gh-pages`branch and be viewed on the pages.

## Flux
The [folder](./flux/) contains all the files needed to istall the helmrelease, It has a kustomization file however is useful for the operator to reconcile from a repo.

I this case, I have install flux using
```commandline
brew install fluxcd/tap/flux
````

The rest of the things can be installed via
```bash
sh flux/install.sh
``` 
helmreposiotry applies the chart
helmrelease create a release which is an instance of the chart hence the app gets deployed.

flux will look at the kustomization and apply the files in the order specificied. Since the job `depends On` the helm release, flux will only install if the release was successful.

## Build and Run mongodb dockerimage
```commandline
docker build -t local-mongodb .
docker run -d --name mongodb -p 27017:27017 -v $(pwd)/data:/data/db local-mongodb
```

## Connect to mongodb locally
Install mongosh

`brew install mongosh`

```commandline
mongosh --host localhost --port 27017
```

# List databases
show dbs

# Switch to jestMetrics database
use jestMetrics

# Show collections
show collections

# Query test results
db.testResults.find()

# Pretty print results
db.testResults.find().pretty()

# Count documents
db.testResults.countDocuments()
