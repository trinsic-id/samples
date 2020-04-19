const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");

const client = new AgencyServiceClient(new Credentials("<access token>", "<subscription key>"), { noRetryPolicy: true });

const listOrganizations = async () => {
    var result = await client.listTenants();
    result.forEach(org => console.log(org));
}

const createVerificationPolicy = async () => {
    var response = await client.createVerificationPolicy({
        verificationPolicyParameters: {
            name: "verification-name",
            version: "1.0",
            attributes: [ {
                    policyName: "proof of valid id",
                    attributeNames: [ 
                        "first name", 
                        "last name", 
                        "address" 
                    ]
                } ],
            predicates: [ {
                    policyName: "must be over 21",
                    attributeName: "age",
                    predicateType: ">",
                    predicateValue: 21,
                    restrictions: [ {
                        schemaName: "government id"
                    } ]
                } ]
        }
    });
    var policy = await client.getVerificationPolicy(response.policyId);
    console.log(policy);
}

const createConnectionInvitation = async () => {
    var invitation = await client.createConnection({
        connectionInvitationParameters: {}
    });
    console.log(invitation);
}

listOrganizations();

createVerificationPolicy();

createConnectionInvitation();