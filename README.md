# Samples for using Trinsic Service Client packages
To access the platform and get your access keys, go to the [developer portal](https://studio.trinsic.id) and create a free account.

Available samples:
- AspNetCore sample using WebApi
- Nodejs sample using NPM package

## How to run the NodeJs Samples
Prerequisites:
- install npm

### Revocation Sample
Go to the nodejs directory.

In the `revocation-test.js` file, uncomment the test you would like to run. 

Run these commands
- `npm install`
- `node revocation-test.js`

## Packages

### Nuget

The [package](https://www.nuget.org/packages/Trinsic.ServiceClients/) is available for `.netstandard2.0` and up.

```cmd
dotnet add package Trinsic.ServiceClients
```

### NPM

The package contains type definitions for typescript.

```cmd
npm install --save @trinsic/service-clients
```

Please open an issue in this repo for any questions or issues running these packages.
