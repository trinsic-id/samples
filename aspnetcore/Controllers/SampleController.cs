using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Trinsic.ServiceClients;
using Trinsic.ServiceClients.Models;

namespace WebApiSample.Controllers
{
    [ApiController]
    public class SampleController : ControllerBase
    {
        private readonly ICredentialsServiceClient _credentialsClient;
        private readonly IProviderServiceClient _providerClient;
        private readonly IWalletServiceClient _walletClient;

        public SampleController(ICredentialsServiceClient credentialsClient, IProviderServiceClient providerClient, IWalletServiceClient walletClient)
        {
            _credentialsClient = credentialsClient;
            _providerClient = providerClient;
            _walletClient = walletClient;
        }

        /// <summary>
        /// Retrieve a list of registered tenant organizations
        /// </summary>
        /// <returns></returns>
        [HttpGet("api/organizations")]
        public async Task<IEnumerable<TenantContract>> GetOrganizations()
        {
            return await _providerClient.ListTenantsAsync();
        }

        /// <summary>
        /// Retrieve a list of registered tenant organizations
        /// </summary>
        /// <returns></returns>
        [HttpGet("api/connections")]
        public async Task<IEnumerable<ConnectionContract>> GetContracts()
        {
            return await _credentialsClient.ListConnectionsAsync();
        }

        /// <summary>
        /// Retrieve a list of registered tenant organizations
        /// </summary>
        /// <returns></returns>
        [HttpGet("api/wallets")]
        public async Task<IEnumerable<CustodianWalletContract>> GetWallets()
        {
            return await _walletClient.ListWalletsAsync();
        }
    }
}
