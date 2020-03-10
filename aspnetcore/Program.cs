using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using Streetcred.ServiceClients;
using System.Threading.Tasks;
using Streetcred.ServiceClients.Models;
using Microsoft.Rest;

namespace aspnetcore_console
{
    class Program
    {
        static HttpClient httpClient = new HttpClient();

        static void Main(string[] args)
        {
            Console.WriteLine("__C# Getting Started Guid__");
            RunSample().GetAwaiter().GetResult();
        }
        static async Task RunSample()
        {
            bool shouldContinue = true;       
  
            IAgencyServiceClient farberClient = GetFarberClient();
            IAgencyServiceClient acmeClient = GetAcmeClient();

            State.transcriptCredentialId = "SayTr6bVynKnQd8aGEtnBH:3:CL:84282:Default";
            State.employmentCredentialId = "SDyfZFQFJyoih6kukJHvH2:3:CL:84733:new";
            State.transcriptVerificationId = "29225cce-27dd-49d9-b854-fcbbae1a9e1e";

            // These methods only demonstrate how creating organizations and definitions could be done.
            // // add organization
            // FarberCollegeOrganization = await client.CreateTenantAsync(new TenantParameters
            //     {
            //         // IssuerSeed = Model.EndorserSeed,
            //         Name = "Farber College",
            //         ImageUrl = null,
            //         NetworkId = "sovrin-staging",
            //         // EndorserType = "Shared"
            //     });

            // // create credential
            // CollegeTranscriptCredential = await client.CreateCredentialDefinitionAsync(new CredentialDefinitionFromSchemaParameters 
            //     {
            //         Name = "College Transcript",
            //         Version = "1.0",
            //         AttrNames = {"Name", "Major", "GPA", "Year"},
            //         SupportRevocation = false,
            //         Tag = "default"
            //      });

            // AcmeOrganization = await _client.CreateTenantAsync(new TenantParameters
            //     {
            //         // IssuerSeed = EndorserSeed,
            //         Name = "Acme Corp",
            //         ImageUrl = null,
            //         NetworkId = "sovrin-staging",
            //         EndorserType = "Shared"
            //     });

            // EmployeeCertificateCredential = await _client.CreateCredentialDefinitionAsync(new CredentialDefinitionFromSchemaParameters 
            //         {
            //             Name = "Employee Certificate",
            //             Version = "1.0",
            //             AttrNames = {"Name", "Salary", "Experience", "Start Date"},
            //             SupportRevocation = false,
            //             Tag = "default"
            //         });

            // ProofOfTranscript = await _client.CreateVerificationDefinitionAsync(new ProofRequest
            //     {
            //         Name = "Proof of Transcript",
            //         Version = "1.0",
            //         Nonce = null,
            //         RequestedAttributes = new Dictionary<string,ProofAttributeInfo>
            //         {
            //             {"First Name", new ProofAttributeInfo{ Name = "First Name"}},
            //             {"Last Name", new ProofAttributeInfo{ Name = "Last Name"}},
            //             {"Degree", new ProofAttributeInfo{ Name = "Major"}},
            //             {"GPA", new ProofAttributeInfo{ Name = "GPA"}},
            //             {"Year", new ProofAttributeInfo{ Name = "Year"}}
            //         },
            //         RequestedPredicates = new Dictionary<string,ProofPredicateInfo>()
            // });

            while(shouldContinue)
            {
                Console.Write("===========\nPlease select an option by number: \n\t[1] Get an invitation URL from Farber College \n\t[2] Send Alice a College Transcript Credential \n\t[3] Get an invitation URL from ACME Corp \n\t[4] Request the verification of a College Trancript Credential \n\t[5] Send Alice a Employee Certificate Credential \n\t[*] quit \n===========\n>");
                var rawInput = Console.ReadLine();
                int inputValue;
                if(int.TryParse(rawInput, out inputValue))
                {
                    var input = int.Parse(rawInput);
                    switch(input)
                    {
                        // connect with Farber College
                        case 1:
                            var farberConnection = await farberClient.CreateConnectionAsync(new ConnectionInvitationParameters());
                            Console.WriteLine("Success! Open this url and scan the QR Code and accept the connection on your mobile wallet:");
                            Console.WriteLine(farberConnection.InvitationUrl);
                            State.farberConnection= farberConnection.ConnectionId;
                            break;

                        // issue college transcript credential
                        case 2:
                            var credential = await farberClient.CreateCredentialAsync(new CredentialOfferParameters{
                                DefinitionId = State.transcriptCredentialId,
                                ConnectionId = State.farberConnection,
                                AutomaticIssuance = true,
                                CredentialValues = new Dictionary<string,string>{
                                {"Name", "Alice"},
                                {"Major", "Computer Science"},
                                {"GPA", "4.0"},
                                {"Year of Graduation", "2020"}},
                            });
                            Console.WriteLine("College Transcript Credential issued. Please accept the credential on your mobile wallet.");
                            break;

                        // connect with ACME Corp
                        case 3:
                            var acmeConnection = await acmeClient.CreateConnectionAsync(new ConnectionInvitationParameters());
                            Console.WriteLine("Success! Open this url and scan the QR Code and accept the connection on your mobile wallet:");
                            Console.WriteLine(acmeConnection.InvitationUrl);
                            State.acmeConnection= acmeConnection.ConnectionId;
                            break;

                        // verify college transcript
                        case 4:
                            var verification = await acmeClient.CreateVerificationAsync( new VerificationParameters{
                                VerificationDefinitionId = State.transcriptVerificationId,
                                ConnectionId = State.acmeConnection
                            });
                            Console.WriteLine("Verification requested. Please show proof of your credential on your mobile wallet.");
                            State.verificationId = verification.Id;
                            break;

                        // issue employee certificate credential
                        case 5: 
                            await acmeClient.CreateCredentialAsync(new CredentialOfferParameters{
                                DefinitionId = State.employmentCredentialId,
                                ConnectionId = State.acmeConnection,
                                AutomaticIssuance = true,
                                CredentialValues = new Dictionary<string,string>{
                                {"Name", "Alice"},
                                {"Salary", "100,000"},
                                {"Experience", "4 years"},
                                {"Start Date", "2020"}},
                            });
                            Console.WriteLine("Employee Certificate Credential issued. Please accept the credential on your mobile wallet.");
                            break;

                        // quit
                        default:
                            Console.WriteLine("Goodbye, friend.");
                            shouldContinue = false;
                            break;
                    }
                }
                else{
                    shouldContinue = false;
                }
                
            }

        }

        static IAgencyServiceClient GetFarberClient()
        {
            string accessToken = "WbJkFwtC10cBMaA1KOlYHGJIpVb3jQXMkPHb8KJDHLc";
            string subscriptionKey = "258ccbd91797430299a41ffb00981c74";
            StreetcredClientCredentials creds = new StreetcredClientCredentials(accessToken, subscriptionKey);
            return new AgencyServiceClient(creds);
        }

        static IAgencyServiceClient GetAcmeClient()
        {

            string accessToken = "xPnWFKcN61muoj4Tkw-V46r-MNFTolxfQOzH_b3HmXE";
            string subscriptionKey = "258ccbd91797430299a41ffb00981c74";
            StreetcredClientCredentials creds = new StreetcredClientCredentials(accessToken, subscriptionKey);
            return new AgencyServiceClient(creds);
        }

    }

        public static class State
    {
        public static string verificationId {get; set;}
        public static string transcriptCredentialId {get; set;}
        public static string employmentCredentialId {get; set;}
        public static string transcriptVerificationId {get; set;}
        public static string credentialId {get; set;}
        public static string credentialDefinitionId {get; set;}
        public static string farberConnection {get; set;}
        public static string acmeConnection {get; set;}
    }

    public class StreetcredClientCredentials : ServiceClientCredentials
    {        
        private string AccessToken {get; set;}
        private string SubscriptionKey {get; set;}
        public StreetcredClientCredentials(string accessToken, string subscriptionKey)
        {
            AccessToken = accessToken;
            SubscriptionKey = subscriptionKey;
        }
        
        /// <inheritdoc />
        public override Task ProcessHttpRequestAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            request.Headers.Add("Authorization", $"Bearer {AccessToken}");
            request.Headers.Add("X-Streetcred-Subscription-Key", SubscriptionKey);
            request.Headers.Add("X-Scrd-Api-Key", SubscriptionKey);
            return base.ProcessHttpRequestAsync(request, cancellationToken);
        }
    }
    
}
