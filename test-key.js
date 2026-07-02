// test-key.js
// A utility script to diagnose Gemini API Key and Project permissions.
// Usage: node test-key.js [YOUR_API_KEY]

const https = require('https');

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('\n❌ Error: No API key provided!');
  console.log('Please provide your API key as an argument or set the GEMINI_API_KEY environment variable.');
  console.log('Example: node test-key.js AIzaSy...\n');
  process.exit(1);
}

const maskedKey = apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);

console.log(`\n==================================================`);
console.log(`Starting Gemini API Key Diagnostics`);
console.log(`Testing Key: ${maskedKey}`);
console.log(`==================================================\n`);

function makeRequest(path, method, postData = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 0,
        statusMessage: e.message,
        body: ''
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testModel(model) {
  const postData = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: 'Hello, this is a connectivity test. Respond with one word: Success.' }]
    }]
  });

  console.log(`Testing with model: ${model}...`);
  const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await makeRequest(path, 'POST', postData);

  console.log(`HTTP Status: ${response.statusCode} ${response.statusMessage}`);
  try {
    const json = JSON.parse(response.body);
    if (response.statusCode === 200) {
      console.log(`✅ Success! Response: "${json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}"\n`);
      return true;
    } else {
      console.log(`❌ Failed with error response:`);
      console.log(JSON.stringify(json, null, 2));
      console.log();
      return false;
    }
  } catch (e) {
    console.log(`❌ Failed to parse response JSON. Raw output:`);
    console.log(response.body);
    console.log();
    return false;
  }
}

(async () => {
  // Step 1: List Available Models to see if list endpoint works and see what models are permitted
  console.log('Retrieving available models list...');
  const listResponse = await makeRequest(`/v1beta/models?key=${apiKey}`, 'GET');
  console.log(`HTTP Status (List Models): ${listResponse.statusCode} ${listResponse.statusMessage}`);
  
  let modelsList = [];
  try {
    const listJson = JSON.parse(listResponse.body);
    if (listResponse.statusCode === 200 && listJson.models) {
      modelsList = listJson.models.map(m => m.name.replace('models/', ''));
      console.log(`Found ${modelsList.length} models:`);
      console.log(modelsList.map(name => ` - ${name}`).join('\n'));
      console.log();
    } else {
      console.log(`Could not retrieve models list:`);
      console.log(JSON.stringify(listJson, null, 2));
      console.log();
    }
  } catch (e) {
    console.log('Failed to parse models list response JSON.\n');
  }

  // Define some candidate models to test if list was empty
  const candidateModels = modelsList.length > 0 
    ? modelsList.filter(m => m.includes('flash') || m.includes('pro'))
    : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'];

  let success = false;
  for (const model of candidateModels) {
    const result = await testModel(model);
    if (result) {
      success = true;
      break;
    }
  }

  console.log(`==================================================`);
  if (success) {
    console.log(`🎉 DIAGNOSIS: API KEY IS WORKING CORRECTLY!`);
  } else {
    console.log(`🚨 DIAGNOSIS: API KEY OR PROJECT IS BLOCKED/RESTRICTED!`);
  }
  console.log(`==================================================\n`);
})();
