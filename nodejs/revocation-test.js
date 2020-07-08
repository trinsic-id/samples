const { v4: uuidv4 } = require('uuid');
const { CredentialsServiceClient, Credentials, WalletServiceClient } = require("@trinsic/service-clients");
const readline = require('readline');

accessToken = '<Access Token>';
const subscriptionKey = '<Subscription Key>';

const credentialsClient = new CredentialsServiceClient(
    new Credentials(accessToken, subscriptionKey),
    { noRetryPolicy: true }
);

const walletClient = new WalletServiceClient(
    new Credentials(accessToken, subscriptionKey),
    { noRetryPolicy: true }
);

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
    const walletName = uuidv4();
    return walletClient.createWallet({
        walletParameters: {
            ownerName: walletName
        }
    });
}

// Create a connection
async function createConnection() {
    return credentialsClient.createConnection({
        connectionInvitationParameters: {
            multiParty: false
        }
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
        credentialDefinitionFromSchemaParameters: {
            name: definitionName,
            version: "1.0",
            attributes: attributeNames,
            supportRevocation: true,
            tag: definitionTag
        }
    });
}

// Offer revocable credential
async function createCredential(definitionId, connectionId) {
    const attributeValues = [uuidv4(), uuidv4(), uuidv4()];
    return credentialsClient.createCredential({
        credentialOfferParameters: {
            definitionId: definitionId,
            connectionId: connectionId,
            automaticIssuance: true,
            credentialValues: {
                first: attributeValues[0],
                second: attributeValues[1],
                third: attributeValues[2]
            }
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
    return credentialsClient.sendVerificationFromParameters(connectionId, {
        verificationPolicyParameters: {
            name: verificationName,
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
    });
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

    const attributeNames = ["first", "second", "third"];
    const definition = await createCredentialDefinition(attributeNames);
    await createCredential(definition.definitionId, connection.connectionId);
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

    const attributeNames = ["first", "second", "third"];
    const definition = await createCredentialDefinition(attributeNames);
    const credential = await createCredential(definition.definitionId, connection.connectionId);
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



// testIsValidWithCloudWallet().then();
// testIsInvalidWithCloudWallet().then();

testIsValidWithMobileWallet().then();
// testIsInvalidWithMobileWallet().then();
