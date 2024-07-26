require('util').inspect.defaultOptions.depth = null;
const { readFile } = require('fs/promises')
const { Bench } = require('tinybench');
const { Parser: XML2JSParser } = require('xml2js');
const { XMLParser: FastXMLParser} = require('fast-xml-parser');
const { Parser: ExpatParser } = require('node-expat');

function xmlToJson(xml) {
  let stack = [];
  let result = {};

  const expatParser = new ExpatParser('UTF-8')

  expatParser.on('startElement', (name, attrs) => {
    const node = { name, attrs, children: [] };
    if (stack.length === 0) {
      result = node;
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  expatParser.on('text', text => {
    if (text.trim()) {
      stack[stack.length - 1].text = text;
    }
  });

  expatParser.on('endElement', name => {
    stack.pop();
  });

  expatParser.parse(xml);

  return result;
}

(async () => {
  const json = await readFile('./sample.json', 'utf-8')
  const xml = await readFile('./sample.xml', 'utf-8')

  const xml2JSParser = new XML2JSParser({
    async: true,
    normalize: true, // Trim whitespace inside text nodes
    normalizeTags: true, // Transform tags to lowercase
    explicitArray: false, // Only put properties in array if length > 1
  });

  const fastXMLParser = new FastXMLParser();

  const bench = new Bench({ time: 500 });
  bench
    .add('JSON.parse', () => {
      JSON.parse(json)
    })
    .add('xml2js', async () => {
      await xml2JSParser.parseStringPromise(xml)
    })
    .add('fast-xml-parser', () => {
      fastXMLParser.parse(xml)
    })
    .add('node-expat', () => {
      xmlToJson(xml)
    })

  await bench.warmup();
  await bench.run();

  console.table(bench.table());

  // console.log(await xml2JSParser.parseStringPromise(xml))
  // console.log(fastXMLParser.parse(xml))
  // console.log(xmlToJson(xml))
})();
