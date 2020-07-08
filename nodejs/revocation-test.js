const { v4: uuidv4 } = require('uuid');
const { CredentialsServiceClient, Credentials, WalletServiceClient } = require("@trinsic/service-clients");

const accessToken = '<access token>';
const subscriptionKey = '<subscription key>';

const credentialsClient = new CredentialsServiceClient(
    new Credentials(accessToken, subscriptionKey),
    { noRetryPolicy: true }
);

const walletClient = new WalletServiceClient(
    new Credentials(accessToken, subscriptionKey),
    { noRetryPolicy: true }
);

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
async function testIsValid() {
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
async function testIsInvalid() {
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

testIsValid().then();
console.log('\n');
testIsInvalid().then();
