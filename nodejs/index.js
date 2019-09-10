const AgencyServiceClient = require("@streetcred.id/service-clients").AgencyServiceClient;
const Credentials = require("@streetcred.id/service-clients").Credentials;

const client = new AgencyServiceClient(new Credentials("<access token>", "<subscription key>"));

const listOrganizations = async () => {
    var result = await client.listTenants();
    result.forEach(org => console.log(org));
}

listOrganizations()