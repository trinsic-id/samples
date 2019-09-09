using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Streetcred.ServiceClients;
using Streetcred.ServiceClients.Models;

namespace WebApiSample.Controllers
{
    [ApiController]
    public class SampleController : ControllerBase
    {
        private readonly IAgencyServiceClient _client;

        public SampleController(IAgencyServiceClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Retrieve a list of registered tenant organizations
        /// </summary>
        /// <returns></returns>
        [HttpGet("api/organizations")]
        public async Task<IEnumerable<TenantContract>> Get()
        {
            return await _client.ListTenantsAsync();
        }
    }
}
