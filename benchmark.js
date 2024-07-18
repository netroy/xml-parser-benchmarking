const { readFile } = require('fs/promises')
const { Parser } = require('xml2js');
const { Bench } = require('tinybench');
const { XMLParser} = require("fast-xml-parser");

(async () => {
  const json = await readFile('./sample.json')
  const xml = await readFile('./sample.xml')

  const xmlParser1 = new Parser({
    async: true,
    normalize: true, // Trim whitespace inside text nodes
    normalizeTags: true, // Transform tags to lowercase
    explicitArray: false, // Only put properties in array if length > 1
  });

  const xmlParser2 = new XMLParser();

  const bench = new Bench({ time: 1000 });
  bench
    .add('JSON.parse', () => {
      JSON.parse(json)
    })
    .add('xml2js', async () => {
      await xmlParser1.parseStringPromise(xml)
    })
    .add('fast-xml-parser', () => {
      xmlParser2.parse(xml)
    })

  await bench.warmup();
  await bench.run();

  console.table(bench.table());
})();
