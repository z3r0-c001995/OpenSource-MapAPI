import { OpenSourceMapApiClient } from '../../packages/js-sdk/src/index.ts';

const client = new OpenSourceMapApiClient('http://localhost:3000');

const run = async () => {
  console.log(await client.getConfig());
  console.log(await client.autocomplete({ query: 'East Park Mall', location: { lat: -15.4067, lng: 28.2871 } }));
};

run();
