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