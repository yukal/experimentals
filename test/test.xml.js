'use strict';

const assert = require('assert');
const XML = require('../xml/src');

describe('XML', function () {
  it('compressToCanonicalText()', function () {
    const xmlText = `
      <?xml version="1.0"?>
      <p>
            text-1

            <span attr="val1" />

        text-2

        <span attr="val2" />
            text-3

            <span attr="val4" />

        text-4
      </p>
    `;

    const canonical = XML.compressToCanonicalText(xmlText);
    const expecting = '<?xml version="1.0"?><p>text-1<span attr="val1" />text-2<span attr="val2" />text-3<span attr="val4" />text-4</p>';

    assert.equal(canonical, expecting);
  });

  it('DocumentReader()', function () {
    const xmlText = `
      <!--

      comment
      <someTag>some text</someTag>

      -->
      <root>
        text-1
        <item attr="val1" />
        text-2
        <item attr="val2" />
        text-3
        <item attr="val3" />
        text-4
      </root>
    `;

    const canonical = XML.compressToCanonicalText(xmlText);
    const items = [...XML.DocumentReader(canonical)];

    assert.deepEqual(items, [
      {
        tagType: XML.TAG_OPENED,
        tagName: 'root',
        attributes: {},
        text: ''
      },
      {
        tagType: XML.TAG_SINGLE,
        tagName: 'item',
        attributes: { attr: 'val1' },
        text: 'text-1'
      },
      {
        tagType: XML.TAG_SINGLE,
        tagName: 'item',
        attributes: { attr: 'val2' },
        text: 'text-2'
      },
      {
        tagType: XML.TAG_SINGLE,
        tagName: 'item',
        attributes: { attr: 'val3' },
        text: 'text-3'
      },
      {
        tagType: XML.TAG_CLOSED,
        tagName: 'root',
        text: 'text-4'
      }
    ]);

    assert.equal(items[0].attributes.attrsLength, 0);
    assert.equal(items[1].attributes.attrsLength, 1);
    assert.equal(items[2].attributes.attrsLength, 1);
    assert.equal(items[3].attributes.attrsLength, 1);
  });

  describe('Parser', function () {
    describe.skip('ALG_XML', function () {
      describe('Single Tag', function () {
        it('test single tag', function () { });
      });

      describe('Opened Tag', function () {
        it('test opened tag', function () { });
      });

      describe('Closed Tag', function () {
        it('test closed tag', function () { });
      });
    });

    describe.skip('ALG_HTML', function () {
      describe('Single Tag', function () {
        it('test single tag', function () { });
      });

      describe('Opened Tag', function () {
        it('test opened tag', function () { });
      });

      describe('Closed Tag', function () {
        it('test closed tag', function () { });
      });
    });

    describe('ALG_AUTO', function () {
      describe('TODO: General', function () {
        it('return object with text', function () {
          const text = `<item>link-text-1</item>`;
          const tree = XML.parse(text);

          assert.deepEqual(tree, {
            item: 'link-text-1'
          });
        });

        it('return object with attributes & text', function () {
          const text = `
            <item>
              <a href="link-1">link-text-1</a>
            </item>
          `;

          const tree = XML.parse(text);

          assert.deepEqual(tree, {
            item: {
              a: { '@href': 'link-1', text: 'link-text-1' }
            }
          });
        });
      });

      describe('Single Tag & Paired Tag', function () {
        it('return array on case SS', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items attr="val-2" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                { attr: 'val-2' },
              ]
            }
          });
        });

        it('return array on case SP', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items>val-2</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                'val-2',
              ]
            }
          });
        });

        it('return array on case PS', function () {
          const text = `
          <data>
            <items>val-1</items>
            <items attr="val-2" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                'val-1',
                { attr: 'val-2' },
              ]
            }
          });
        });

        it('return array on case PP', function () {
          const text = `
          <data>
            <items>val-1</items>
            <items>val-2</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: ['val-1', 'val-2']
            }
          });
        });

        it('return array on case SSS', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items attr="val-2" />
            <items attr="val-3" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                { attr: 'val-2' },
                { attr: 'val-3' },
              ]
            }
          });
        });

        it('return array on case SSP', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items attr="val-2" />
            <items>val-3</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                { attr: 'val-2' },
                'val-3',
              ]
            }
          });
        });

        it('return array on case SPS', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items>val-2</items>
            <items attr="val-3" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                'val-2',
                { attr: 'val-3' },
              ]
            }
          });
        });

        it('return array on case PSS', function () {
          const text = `
          <data>
            <items>val-1</items>
            <items attr="val-2" />
            <items attr="val-3" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                'val-1',
                { attr: 'val-2' },
                { attr: 'val-3' },
              ]
            }
          });
        });

        it('return array on case PPP', function () {
          const text = `
          <data>
            <items>val-1</items>
            <items>val-2</items>
            <items>val-3</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: ['val-1', 'val-2', 'val-3']
            }
          });
        });

        it('return array on case PPS', function () {
          const text = `
          <data>
            <items>val-1</items>
            <items>val-2</items>
            <items attr="val-3" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                'val-1',
                'val-2',
                { attr: 'val-3' },
              ]
            }
          });
        });

        it('return array on case PSP', function () {
          const text = `
          <data>
            <items>val-1</items>
            <items attr="val-2" />
            <items>val-3</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                'val-1',
                { attr: 'val-2' },
                'val-3',
              ]
            }
          });
        });

        it('return array on case SPP', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items>val-2</items>
            <items>val-3</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                'val-2',
                'val-3',
              ]
            }
          });
        });
      });

      describe('Single Tag & Paired Tag (with attributes & text)', function () {
        it('return array on case SP[at]', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items attr="val-2">tag-2-text</items>
          </data>
        `;

          const tree = XML.parse(text);

          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                {
                  '@attr': 'val-2',
                  text: 'tag-2-text'
                },
              ]
            }
          });
        });

        it('return array on case P[at]S', function () {
          const text = `
          <data>
            <items attr="val-1">tag-1-text</items>
            <items attr="val-2" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                {
                  '@attr': 'val-1',
                  text: 'tag-1-text'
                },
                { attr: 'val-2' },
              ]
            }
          });
        });

        it('return array on case SSP[at]', function () {
          const text = `
          <data>
            <items attr="val-1" />
            <items attr="val-2" />
            <items attr="val-3">tag-3-text</items>
          </data>
        `;

          const tree = XML.parse(text);

          assert.deepEqual(tree, {
            data: {
              items: [
                { attr: 'val-1' },
                { attr: 'val-2' },
                {
                  '@attr': 'val-3',
                  text: 'tag-3-text'
                },
              ]
            }
          });
        });

        it('return array on case P[at]SS', function () {
          const text = `
          <data>
            <items attr="val-1">tag-1-text</items>
            <items attr="val-2" />
            <items attr="val-3" />
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                {
                  '@attr': 'val-1',
                  text: 'tag-1-text'
                },
                { attr: 'val-2' },
                { attr: 'val-3' },
              ]
            }
          });
        });

        it('return array on case P[at]P[t]', function () {
          const text = `
          <data>
            <items attr="val-1">tag-1-text</items>
            <items>tag-2-text</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                {
                  '@attr': 'val-1',
                  text: 'tag-1-text'
                },
                'tag-2-text',
              ]
            }
          });
        });

        it('return array on case P[t]P[at]', function () {
          const text = `
          <data>
            <items>tag-1-text</items>
            <items attr="val-2">tag-2-text</items>
          </data>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            data: {
              items: [
                'tag-1-text',
                {
                  '@attr': 'val-2',
                  text: 'tag-2-text'
                },
              ]
            }
          });
        });
      });

      describe('Text & Single Tag', function () {
        it('return array on case TS', function () {
          const text = `
          <items>
            text-1
            <single attr="val-1" />
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'single', attr: 'val-1' },
            ]
          });
        });

        it('return array on case ST', function () {
          const text = `
          <items>
            <single attr="val-1" />
            text-1
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'single', attr: 'val-1' },
              'text-1',
            ]
          });
        });

        it('return array on case SST', function () {
          const text = `
          <items>
            <single attr="val-1" />
            <single attr="val-2" />
            text-1
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'single', attr: 'val-1' },
              { tagName: 'single', attr: 'val-2' },
              'text-1',
            ]
          });
        });

        it('return array on case STS', function () {
          const text = `
          <items>
            <single attr="val-1" />
            text-1
            <single attr="val-2" />
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'single', attr: 'val-1' },
              'text-1',
              { tagName: 'single', attr: 'val-2' },
            ]
          });
        });

        it('return array on case TST', function () {
          const text = `
          <items>
            text-1
            <single attr="val-1" />
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'single', attr: 'val-1' },
              'text-2',
            ]
          });
        });

        it('return array on case SSTS', function () {
          const text = `
          <items>
            <single attr="val-1" />
            <single attr="val-2" />
            text-1
            <single attr="val-3" />
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'single', attr: 'val-1' },
              { tagName: 'single', attr: 'val-2' },
              'text-1',
              { tagName: 'single', attr: 'val-3' },
            ]
          });
        });

        it('return array on case STST', function () {
          const text = `
          <items>
            <single attr="val-1" />
            text-1
            <single attr="val-2" />
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'single', attr: 'val-1' },
              'text-1',
              { tagName: 'single', attr: 'val-2' },
              'text-2',
            ]
          });
        });

        it('return array on case TSST', function () {
          const text = `
          <items>
            text-1
            <single attr="val-1" />
            <single attr="val-2" />
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'single', attr: 'val-1' },
              { tagName: 'single', attr: 'val-2' },
              'text-2',
            ]
          });
        });

        it('return array on case TSTS', function () {
          const text = `
          <items>
            text-1
            <single attr="val-1" />
            text-2
            <single attr="val-2" />
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'single', attr: 'val-1' },
              'text-2',
              { tagName: 'single', attr: 'val-2' },
            ]
          });
        });
      });

      describe('Text & Paired Tag (without attributes)', function () {
        it('return array on case TP', function () {
          const text = `
          <items>
            text-1
            <paired>paired tag text</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', text: 'paired tag text' },
            ]
          });
        });

        it('return array on case PT', function () {
          const text = `
          <items>
            <paired>paired tag text</paired>
            text-1
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', text: 'paired tag text' },
              'text-1',
            ]
          });
        });

        it('return array on case PPT', function () {
          const text = `
          <items>
            <paired>paired tag text #1</paired>
            <paired>paired tag text #2</paired>
            text-1
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', text: 'paired tag text #1' },
              { tagName: 'paired', text: 'paired tag text #2' },
              'text-1',
            ]
          });
        });

        it('return array on case PTP', function () {
          const text = `
          <items>
            <paired>paired tag text #1</paired>
            text-1
            <paired>paired tag text #2</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', text: 'paired tag text #1' },
              'text-1',
              { tagName: 'paired', text: 'paired tag text #2' },
            ]
          });
        });

        it('return array on case TPT', function () {
          const text = `
          <items>
            text-1
            <paired>paired tag text #1</paired>
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', text: 'paired tag text #1' },
              'text-2',
            ]
          });
        });

        it('return array on case PPTP', function () {
          const text = `
          <items>
            <paired>paired tag text #1</paired>
            <paired>paired tag text #2</paired>
            text-1
            <paired>paired tag text #3</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', text: 'paired tag text #1' },
              { tagName: 'paired', text: 'paired tag text #2' },
              'text-1',
              { tagName: 'paired', text: 'paired tag text #3' },
            ]
          });
        });

        it('return array on case PTPT', function () {
          const text = `
          <items>
            <paired>paired tag text #1</paired>
            text-1
            <paired>paired tag text #2</paired>
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', text: 'paired tag text #1' },
              'text-1',
              { tagName: 'paired', text: 'paired tag text #2' },
              'text-2',
            ]
          });
        });

        it('return array on case TPPT', function () {
          const text = `
          <items>
            text-1
            <paired>paired tag text #1</paired>
            <paired>paired tag text #2</paired>
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', text: 'paired tag text #1' },
              { tagName: 'paired', text: 'paired tag text #2' },
              'text-2',
            ]
          });
        });

        it('return array on case TPTP', function () {
          const text = `
          <items>
            text-1
            <paired>paired tag text #1</paired>
            text-2
            <paired>paired tag text #2</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', text: 'paired tag text #1' },
              'text-2',
              { tagName: 'paired', text: 'paired tag text #2' },
            ]
          });
        });
      });

      describe('Text & Paired Tag (with attributes)', function () {
        it('return array on case TP', function () {
          const text = `
          <items>
            text-1
            <paired attr="val1">paired tag text #1</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
            ]
          });
        });

        it('return array on case PT', function () {
          const text = `
          <items>
            <paired attr="val1">paired tag text #1</paired>
            text-1
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              'text-1',
            ]
          });
        });

        it('return array on case PPT', function () {
          const text = `
          <items>
            <paired attr="val1">paired tag text #1</paired>
            <paired attr="val2">paired tag text #2</paired>
            text-1
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { '@attr': 'val1', tagName: 'paired', text: 'paired tag text #1' },
              { '@attr': 'val2', tagName: 'paired', text: 'paired tag text #2' },
              'text-1',
            ]
          });
        });

        it('return array on case PTP', function () {
          const text = `
          <items>
            <paired attr="val1">paired tag text #1</paired>
            text-1
            <paired attr="val2">paired tag text #2</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              'text-1',
              { tagName: 'paired', '@attr': 'val2', text: 'paired tag text #2' },
            ]
          });
        });

        it('return array on case TPT', function () {
          const text = `
          <items>
            text-1
            <paired attr="val1">paired tag text #1</paired>
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              'text-2',
            ]
          });
        });

        it('return array on case PPTP', function () {
          const text = `
          <items>
            <paired attr="val1">paired tag text #1</paired>
            <paired attr="val2">paired tag text #2</paired>
            text-1
            <paired attr="val3">paired tag text #3</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              { tagName: 'paired', '@attr': 'val2', text: 'paired tag text #2' },
              'text-1',
              { tagName: 'paired', '@attr': 'val3', text: 'paired tag text #3' },
            ]
          });
        });

        it('return array on case PTPT', function () {
          const text = `
          <items>
            <paired attr="val1">paired tag text #1</paired>
            text-1
            <paired attr="val2">paired tag text #2</paired>
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              'text-1',
              { tagName: 'paired', '@attr': 'val2', text: 'paired tag text #2' },
              'text-2',
            ]
          });
        });

        it('return array on case TPPT', function () {
          const text = `
          <items>
            text-1
            <paired attr="val1">paired tag text #1</paired>
            <paired attr="val2">paired tag text #2</paired>
            text-2
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              { tagName: 'paired', '@attr': 'val2', text: 'paired tag text #2' },
              'text-2',
            ]
          });
        });

        it('return array on case TPTP', function () {
          const text = `
          <items>
            text-1
            <paired attr="val1">paired tag text #1</paired>
            text-2
            <paired attr="val2">paired tag text #2</paired>
          </items>
        `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'paired', '@attr': 'val1', text: 'paired tag text #1' },
              'text-2',
              { tagName: 'paired', '@attr': 'val2', text: 'paired tag text #2' },
            ]
          });
        });
      });

      describe('TODO: Text & Mixed Tags', function () {
        it('return array on case SPT', function () {
          const text = `
              <items>
                <a href="link-1" />
                <a href="link-2">link-text-2</a>
                text-3
              </items>
            `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', href: 'link-1' },
              { tagName: 'a', '@href': 'link-2', text: 'link-text-2' },
              'text-3'
            ]
          });
        });

        it('return array on case STP', function () {
          const text = `
              <items>
                <a href="link-1" />
                text-2
                <a href="link-3">link-text-3</a>
              </items>
            `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', href: 'link-1' },
              'text-2',
              { tagName: 'a', '@href': 'link-3', text: 'link-text-3' },
            ]
          });
        });

        it('return array on case PST', function () {
          const text = `
            <items>
              <a href="link-1">link-text-1</a>
              <a href="link-2" />
              text-3
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', '@href': 'link-1', text: 'link-text-1' },
              { tagName: 'a', href: 'link-2' },
              'text-3'
            ]
          });
        });

        it('return array on case TSP', function () {
          const text = `
            <items>
              text-1
              <a href="link-2" />
              <a href="link-3">link-text-3</a>
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'a', href: 'link-2' },
              { tagName: 'a', '@href': 'link-3', text: 'link-text-3' },
            ]
          });
        });

        it('return array on case PTS', function () {
          const text = `
            <items>
              <a href="link-1">link-text-1</a>
              text-2
              <a href="link-3" />
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', '@href': 'link-1', text: 'link-text-1' },
              'text-2',
              { tagName: 'a', href: 'link-3' },
            ]
          });
        });

        it('return array on case TPS', function () {
          const text = `
            <items>
              text-1
              <a href="link-2">link-text-2</a>
              <a href="link-3" />
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'a', '@href': 'link-2', text: 'link-text-2' },
              { tagName: 'a', href: 'link-3' },
            ]
          });
        });

        /* -------------------------------------- */

        it.skip('return array on case SSPT', function () {
          const text = `
              <items>
                <a href="link-1" />
                <a href="link-2" />
                <a href="link-3">link-text-3</a>
                text-4
              </items>
            `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', href: 'link-1' },
              { tagName: 'a', href: 'link-2' },
              { tagName: 'a', '@href': 'link-3', text: 'link-text-3' },
              'text-4'
            ]
          });
        });

        it.skip('return array on case SSTP', function () {
          const text = `
              <items>
                <a href="link-1" />
                <a href="link-2" />
                text-3
                <a href="link-4">link-text-4</a>
              </items>
            `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', href: 'link-1' },
              { tagName: 'a', href: 'link-2' },
              'text-3',
              { tagName: 'a', '@href': 'link-4', text: 'link-text-4' },
            ]
          });
        });

        it.skip('return array on case PSST', function () {
          const text = `
            <items>
              <a href="link-1">link-text-1</a>
              <a href="link-2" />
              <a href="link-3" />
              text-4
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', '@href': 'link-1', text: 'link-text-1' },
              { tagName: 'a', href: 'link-2' },
              { tagName: 'a', href: 'link-3' },
              'text-4'
            ]
          });
        });

        it.skip('return array on case PTSS', function () {
          const text = `
            <items>
              <a href="link-1">link-text-1</a>
              text-2
              <a href="link-3" />
              <a href="link-4" />
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', '@href': 'link-1', text: 'link-text-1' },
              'text-2',
              { tagName: 'a', href: 'link-3' },
              { tagName: 'a', href: 'link-4' },
            ]
          });
        });

        it.skip('return array on case PST', function () {
          const text = `
            <items>
              <a href="link-1">link-text-1</a>
              <a href="link-2" />
              text-3
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', '@href': 'link-1', text: 'link-text-1' },
              { tagName: 'a', href: 'link-2' },
              'text-3'
            ]
          });
        });

        it.skip('return array on case TSP', function () {
          const text = `
            <items>
              text-1
              <a href="link-2" />
              <a href="link-3">link-text-3</a>
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'a', href: 'link-2' },
              { tagName: 'a', '@href': 'link-3', text: 'link-text-3' },
            ]
          });
        });

        it.skip('return array on case PTS', function () {
          const text = `
            <items>
              <a href="link-1">link-text-1</a>
              text-2
              <a href="link-3" />
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              { tagName: 'a', '@href': 'link-1', text: 'link-text-1' },
              'text-2',
              { tagName: 'a', href: 'link-3' },
            ]
          });
        });

        it.skip('return array on case TPS', function () {
          const text = `
            <items>
              text-1
              <a href="link-2">link-text-2</a>
              <a href="link-3" />
            </items>
          `;

          const tree = XML.parse(text);
          assert.deepEqual(tree, {
            items: [
              'text-1',
              { tagName: 'a', '@href': 'link-2', text: 'link-text-2' },
              { tagName: 'a', href: 'link-3' },
            ]
          });
        });
      });
    });
  });

  describe.skip('DocumentReader', function () {
    it('test document', function () { });
  });

  describe.skip('HtmlReader', function () {
    it('test document', function () {
      // XML.HtmlReader().xpath();
    });

    it('xpath', function () {
      // XML.HtmlReader().xpath();
    });

    it('pipes', function () {
      // XML.HtmlReader().findOne();
    });
  });

  describe.skip('Xpath', function () {
    it('test xpath', function () { });
  });
});
