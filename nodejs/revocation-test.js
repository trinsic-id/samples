const { v4: uuidv4 } = require('uuid');
// const { CredentialsServiceClient, Credentials, WalletServiceClient } = require("@trinsic/service-clients");
const { CredentialsServiceClient, Credentials, WalletServiceClient, ProviderServiceClient, ProviderCredentials } = require("@trinsic/service-clients");
const readline = require('readline');
// TODO: Use the provider API for this

//const providerKey = '<Provider key>'
// const providerKey = '<Provider key>'
const accessToken = '<Access Token>';

const credentialsClient = new CredentialsServiceClient(
    new Credentials(accessToken),
    { 
        noRetryPolicy: true,
        baseUri: "https://api.trinsic.id/" 
    }
);

const walletClient = new WalletServiceClient(
    new Credentials(accessToken),
    { noRetryPolicy: true }
);

const providerClient = new ProviderServiceClient(
    new ProviderCredentials(providerKey),
    { noRetryPolicy: true }
);

async function createOrg() {
    return providerClient.createTenant({
        name: uuidv4(),
        networkId: 'sovrin-staging',
        endorserType: 'Shared'
    });
}

async function deleteOrg(tenantId) {
    return providerClient.deleteTenant(tenantId);
}

async function getTenantKeys(tenantId){
    return providerClient.getTenantKeys(tenantId);
}

// Wait for user input
function waitForInput(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

// Create a wallet
async function createWallet() {
    return walletClient.createWallet({});
}

// Create a connection
async function createConnection() {

    return await credentialsClient.createConnection({
        multiParty: false
    });
}

// Accept the connection
async function acceptConnectionInvitation(walletId, invitation) {
    return walletClient.acceptInvitation(walletId, invitation);
}

// Create revocable credential definition
async function createCredentialDefinition(attributeNames) {
    const definitionName = uuidv4();
    const definitionTag = uuidv4();
    return credentialsClient.createCredentialDefinition({
        name: definitionName,
        version: "1.0",
        attributes: attributeNames,
        supportRevocation: false,
        tag: definitionTag
    });
}

// Offer revocable credential
async function createCredential(definitionId, connectionId) {
    const attributeValues = [uuidv4(), uuidv4(), uuidv4()];
    return credentialsClient.createCredential({
        definitionId: definitionId,
        connectionId: connectionId,
        automaticIssuance: true,
        credentialValues: {
            first: attributeValues[0],
            second: attributeValues[1],
            third: attributeValues[2]
        }
    });
}

// List all offered credentials
async function listCredentials(walletId) {
    return walletClient.listCredentials(walletId);
}

// Accept the offered revocable credentials
async function acceptOfferedCredentials(offeredCredentials, walletId) {
    for (const offeredCredential of offeredCredentials) {
        if (offeredCredential.state === "Offered") {
            await walletClient.acceptCredentialOffer(walletId, offeredCredential.credentialId);
        }
    }
}

// Send verification from parameters
async function sendVerification(connectionId) {
    const verificationName = uuidv4();
    const policyName = uuidv4();
    return credentialsClient.sendVerificationFromParameters(connectionId,
        {
            name: "verificationName",
            version: "1.0",
            attributes: [
                {
                    policyName: policyName,
                    attributeNames: [
                        'first',
                        'second',
                        'third'
                    ]
                }
            ],
            revocationRequirement: {
                validAt: new Date()
            }
        }
    );
}

// List available verifications
async function listVerifications(walletId) {
    return walletClient.listVerifications(walletId);
}

// Call submitVerificationAutoSelect on each request verification
async function acceptVerificationRequests(availableVerifications, walletId) {
    for (const verificationContract of availableVerifications) {
        if (verificationContract.state === "Requested") {
            await walletClient.submitVerificationAutoSelect(walletId, verificationContract.verificationId);
        }
    }
}

// Get the verification
async function getVerification(verificationId) {
    return credentialsClient.getVerification(verificationId);
}

// Revoke a credential
async function revokeCredential(credentialId) {
    await credentialsClient.revokeCredential(credentialId);
}

// Check that a revocable credential is valid prior to revocation
async function testIsValidWithCloudWallet() {
    const wallet = await createWallet();

    const connection = await createConnection();

    await acceptConnectionInvitation(wallet.walletId, connection.invitation);

    const attributeNames = ["first", "second", "third"];
    const definition = await createCredentialDefinition(attributeNames);

    await createCredential(definition.definitionId, connection.connectionId);

    const offeredCredentials = await listCredentials(wallet.walletId);

    await acceptOfferedCredentials(offeredCredentials, wallet.walletId);

    const verification = await sendVerification(connection.connectionId);

    const availableVerification = await listVerifications(wallet.walletId);

    await acceptVerificationRequests(availableVerification, wallet.walletId);

    const verificationUpdate = await getVerification(verification.verificationId);

    // Check that the isValid = true in the verification
    if (verificationUpdate.isValid) {
        console.log('Test Passed\nVerification is valid');
    } else {
        console.log('Test Failed\nVerification is invalid');
    }
}

// Check that a revocable credential is valid prior to revocation
async function testIsInvalidWithCloudWallet() {
    const wallet = await createWallet();

    const connection = await createConnection();

    await acceptConnectionInvitation(wallet.walletId, connection.invitation);

    const attributeNames = ["first", "second", "third"];
    const definition = await createCredentialDefinition(attributeNames);

    const credential = await createCredential(definition.definitionId, connection.connectionId);

    const offeredCredentials = await listCredentials(wallet.walletId);

    await acceptOfferedCredentials(offeredCredentials, wallet.walletId);

    await revokeCredential(credential.credentialId);

    const verification = await sendVerification(connection.connectionId);

    const availableVerification = await listVerifications(wallet.walletId);

    await acceptVerificationRequests(availableVerification, wallet.walletId);

    const verificationUpdate = await getVerification(verification.verificationId);

    // Check that the isValid = true in the verification
    if (!verificationUpdate.isValid) {
        console.log('Test Passed\nVerification is invalid');
    } else {
        console.log('Test Failed\nVerification is valid');
    }
}

async function testIsValidWithMobileWallet(){
    console.log("************ Test non-revoked credentials pass verification **********")
    const connection = await createConnection();
    console.log(`Connection url: ${connection.invitationUrl}`);
    console.log(connection.invitation);
    await waitForInput('Press any key to continue after accepting the connection\n');

    // const attributeNames = ["first", "second", "third"];
    // const definition = await createCredentialDefinition(attributeNames);
    await createCredential("JyXYMSN3zkkLLqYdv9nCpW:3:CL:136027:default", connection.connectionId);
    await waitForInput('Press any key to continue after accepting the offer\n');

    const verification = await sendVerification(connection.connectionId);
    await waitForInput('Press any key to continue after presenting the verification\n');

    const verificationUpdate = await getVerification(verification.verificationId);
    console.log("Verification:\n");
    console.log(verificationUpdate);

    // Check that the isValid = true in the verification
    console.log("*********************\nResults:")
    if (verificationUpdate.isValid) {
        console.log('\nTest Passed\nVerification is valid');
    } else {
        console.log('\nTest Failed\nVerification is invalid');
    }
}

async function testIsInvalidWithMobileWallet(){
    console.log("************ Test revoked credentials fail verification **********")
    const connection = await createConnection();
    console.log(`Connection url: ${connection.invitationUrl}`);
    console.log(connection.invitation);
    await waitForInput('Press any key to continue after accepting the connection\n');

    // const attributeNames = ["first", "second", "third"];
    // const definition = await createCredentialDefinition(attributeNames);
    const credential = await createCredential("JyXYMSN3zkkLLqYdv9nCpW:3:CL:136027:default", connection.connectionId);
    await waitForInput('Press any key to continue after accepting the offer\n');

    console.log("revoking credential...");
    await revokeCredential(credential.credentialId);
    console.log("...success");
    console.log("sending verification...");
    const verification = await sendVerification(connection.connectionId);
    await waitForInput('Press any key to continue after presenting the verification\n');

    const verificationUpdate = await getVerification(verification.verificationId);
    console.log("Verification:\n");
    console.log(verificationUpdate);

    // Check that the isValid = false in the verification
    console.log("*********************\nResults:")
    if (!verificationUpdate.isValid) {
        console.log('\nTest Passed\nVerification is invalid');
    } else {
        console.log('\nTest Failed\nVerification is valid');
    }
}

// Check that a revocable credential is valid prior to revocation
async function testIssuedCredIsValidWithSameCredDefIdAsPreviouslyRevokedCred_CloudWallet() {
    console.log("************ Testing revoked credential returns invalid verification **********")
    console.log("creating wallet...");
    const wallet = await createWallet();

    console.log("creating connection...");
    const connection = await createConnection();

    console.log("accepting invitation...");
    await acceptConnectionInvitation(wallet.walletId, connection.invitation);

    console.log("creating credential definition...");
    const attributeNames = ["first", "second", "third"];
    const definition = await createCredentialDefinition(attributeNames);

    console.log("offering credential...");
    const credential = await createCredential(definition.definitionId, connection.connectionId);

    console.log("accepting credential...");
    const offeredCredentials = await listCredentials(wallet.walletId);

    await acceptOfferedCredentials(offeredCredentials, wallet.walletId);

    console.log("revoking credential...");
    await revokeCredential(credential.credentialId);

    console.log("sending verification...");
    const verification = await sendVerification(connection.connectionId);

    console.log("presenting verification...");
    const availableVerification = await listVerifications(wallet.walletId);
    await acceptVerificationRequests(availableVerification, wallet.walletId);

    console.log("checking verification...");
    const verificationUpdate = await getVerification(verification.verificationId);

    // Check that the isValid = true in the verification
    if (!verificationUpdate.isValid) {
        console.log('Test Passed\nVerification is invalid');
    } else {
        console.log('Test Failed\nVerification is valid');
    }
    console.log("************ Testing issued credential with same cred def id returns valid verification **********")
    // issue another cred and see if it's valid
    console.log("deleting connection...");
    await credentialsClient.deleteConnection(connection.connectionId);
    console.log("creating new connection...");
    const connection2 = await createConnection();

    console.log("accepting new connection...");
    await acceptConnectionInvitation(wallet.walletId, connection2.invitation);

    console.log("offering credential...");
    const credential2 = await createCredential(definition.definitionId, connection2.connectionId);

    console.log("accepting credential...");
    const offeredCredentials2 = await listCredentials(wallet.walletId);
    await acceptOfferedCredentials(offeredCredentials2, wallet.walletId);

    console.log("sending verification...");
    const verification2 = await sendVerification(connection2.connectionId);

    console.log("submitting verification (the hard way)...");
    const availableVerifications2 = await listVerifications(wallet.walletId);
    for (const verificationContract of availableVerifications2) {
        if (verificationContract.state === "Requested") {
            const policies = await walletClient.getAvailableCredentialsForVerification(wallet.walletId, verificationContract.verificationId);
            console.log("policies: ", policies);
            for (const policy of policies) {
                for(const cred of policy.availableCredentials)
                {
                    console.log("cred: ", cred);
                    if(cred.values["first"] === credential2.values["first"]){
                        await walletClient.submitVerification(wallet.walletId, verificationContract.verificationId, {
                            verificationPolicyCredentialParametersArray: [
                                {
                                    policyName: policy.policyName,
                                    credentialId: cred.credentialId,
                                    hidden: false
                                }
                            ]
                        })
                        console.log("submitted verification. yay");
                    }
                }
            }
        }
    }
    console.log("checking if verification is valid...");
    const verificationUpdate3 = await getVerification(verification2.verificationId);
    console.log("VerificationUpdate3", verificationUpdate3);
    // Check that the isValid = true in the verification
    if (verificationUpdate3.isValid) {
        console.log('Test Passed\nVerification is valid');
    } else {
        console.log('Test Failed\nVerification is invalid');
    }
}

async function testIssuedCredIsValidWithSameCredDefIdAsPreviouslyRevokedCred_MobileWallet(){
    console.log("************ Test non-revoked credentials pass verification **********");
    const connection = await createConnection().catch((error) => {
        console.error(error);
      });
    console.log(`Connection url: ${connection.invitationUrl}`);
    console.log("connection: ");
    console.log(connection);
    await waitForInput('Press any key to continue after accepting the connection\n');

    // const attributeNames = ["first", "second", "third"];
    // const definition = await createCredentialDefinition(attributeNames);
    // console.log("definition: ");
    // console.log(definition);
    const credential = await createCredential("JyXYMSN3zkkLLqYdv9nCpW:3:CL:136027:default", connection.connectionId);
    //const credential = await createCredential("JyXYMSN3zkkLLqYdv9nCpW:3:CL:136012:default", connection.connectionId);

    console.log("credential: ");
    console.log(credential);
    await waitForInput('Press any key to continue after accepting the offer\n');

    const verification = await sendVerification(connection.connectionId);

    await waitForInput('Press any key to continue after presenting the verification\n');

    const verificationUpdate = await getVerification(verification.verificationId);
    console.log("Verification:\n");
    console.log(verificationUpdate);

    // Check that the isValid = true in the verification
    console.log("*********************\nResults:")
    if (verificationUpdate.isValid) {
        console.log('\nTest Passed\nVerification is valid');
    } else {
        console.log('\nTest Failed\nVerification is invalid');
    }

    console.log("revoking credential...");
    await revokeCredential(credential.credentialId);
    console.log("...success");
    console.log("sending verification...");
    const verificationRevoked = await sendVerification(connection.connectionId);
    await waitForInput('Press any key to continue after presenting the verification\n');

    const verificationRevokedUpdate = await getVerification(verificationRevoked.verificationId);
    console.log("Verification:\n");
    console.log(verificationRevokedUpdate);

    // Check that the isValid = false in the verification
    console.log("*********************\nResults:")
    if (!verificationRevokedUpdate.isValid) {
        console.log('\nTest Passed\nVerification is invalid');
    } else {
        console.log('\nTest Failed\nVerification is valid');
    }


    await credentialsClient.deleteConnection(connection.connectionId).catch();
    const connection2 = await createConnection();
    console.log("connection2: ");
    console.log(connection2);
    console.log(connection2.invitation);
    await waitForInput('Delete your connection and credential, then press any key to continue after accepting the second connection\n');

    const credential2 = await createCredential(definition.definitionId, connection2.connectionId);
    console.log("credential2: ");
    console.log(credential2)
    await waitForInput('Press any key to continue after accepting the offer\n');

    const verification2 = await sendVerification(connection2.connectionId);
    await waitForInput('Press any key to continue after presenting the verification\n');
    const verificationUpdate2 = await getVerification(verification2.verificationId);
    console.log("Verification2:\n");
    console.log(verificationUpdate2);

    // Check that the isValid = true in the verification
    console.log("*********************\nResults:")
    if (verificationUpdate2.isValid) {
        console.log('\nTest Passed\nVerification is valid');
    } else {
        console.log('\nTest Failed\nVerification is invalid');
    }

}


// testIsValidWithCloudWallet().then();
// testIsInvalidWithCloudWallet().then();

// testIsValidWithMobileWallet().then().catch(
//     (error) => {
//         console.error(error);
//     }
// );
// testIsInvalidWithMobileWallet().then();
testIsInvalidWithMobileWallet().then().catch(
    (error) => {
        console.error(error);
    }
);

// testIsInvalidWithMobileWallet().then().catch(
//     (error) => {
//         console.error(error);
//     }
// );
/*
{
"connectionId":"c2d3a461-5370-44cc-bf9e-719a375e9fad"
"state":"Invited"
"invitation":"eyJsYWJlbCI6Ik1vYmlsZSBUZXN0IFRlbmFudCBTdGF0aWMiLCJpbWFnZVVybCI6Imh0dHBzOi8vdHJpbnNpY2FwaWFzc2V0cy5h ..."
"invitationUrl":"https://redir.streetcred.id/ql2QPDLrxa9d"
"createdAtUtc":"2020-08-20T21:35:40Z"
"multiParty":true
}
*/