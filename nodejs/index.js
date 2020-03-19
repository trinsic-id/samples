const AgencyServiceClient = require("@streetcred.id/service-clients").AgencyServiceClient;
const Credentials = require("@streetcred.id/service-clients").Credentials;

const client = new AgencyServiceClient(new Credentials("<access token>", "<subscription key>"));

const listOrganizations = async () => {
    var result = await client.listTenants();
    result.forEach(org => console.log(org));
}

const createVerificationDefinition = async () => {
    var response = await client.createVerificationDefinition({
        proofRequest: {
            name: "verification-name",
            version: "1.0",
            requestedAttributes: {
                nameVerification: {
                    name: "firstName"
                }
            }
        }
    });
    var definition = await client.getVerificationDefinition(response.id);
    console.log(definition);
}

const createConnectionInvitation = async () => {
    var invitation = await client.createConnection({
        connectionInvitationParameters: {}
    });
    console.log(invitation);
} 

listOrganizations();

createVerificationDefinition();

createConnectionInvitation();