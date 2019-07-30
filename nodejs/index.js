const AgencyServiceClient = require("@streetcred.id/service-clients").AgencyServiceClient;
const Credentials = require("@streetcred.id/service-clients").Credentials;

var client = new AgencyServiceClient(new Credentials("<access token>", "<subscription key>"));

client.listTenants().then(response =>
    response.forEach(tenant =>
        console.log(tenant)));