'use strict';

const got = require('got');
const _ = require('lodash');
const co = require('co');
const fs = require('fs');
const path = require('path');
const ncp = require("copy-paste");

const DESC = 'Search a Gif';

const query_url = 'http://api.giphy.com/v1/gifs/search?q=';
const api_key = '&api_key=dc6zaTOxFJmzC';

function* queryYoutube(query) {
  const query_enc = encodeURIComponent(query);
  const url = query_url + query_enc + api_key;
  let result = (yield got(url)).body;

  result = JSON.parse(result);
  if (result['data']) {
    return result['data'].map(x => x);
  }
  return null;
}

module.exports = (context) => {
  const shell = context.shell;

  let html = 'sdqsdsqsd';

  function startup() {
    html = fs.readFileSync(path.join(__dirname, 'preview.html'), 'utf8');
  }

  function* search(query, res) {
    const query_trim = query.trim();
    if (query_trim.length === 0)
      return;

    const query_enc = encodeURIComponent(query);

    if (query_enc) {
      let results = yield* queryYoutube(query_trim);
      results = _.reject(results, (x) => x === query_trim);
      results = _.take(results, 5).map((x) => {
        return {
          id: x['images']['original']['url'],
          payload: 'open',
          title: x['slug'],
          desc: x['images']['original']['url'],
          icon: x['images']['fixed_width_small_still']['url'],
          preview: true
        };
      });
      return res.add(results);
    } else {
      return res.add({
        id: `http://giphy.com/search/${query_enc}`,
        payload: 'goto',
        title: 'Search ' + query,
        desc: DESC
      });
    }
  }

  function execute(id, payload) {
    if (payload !== 'open')
      return;
    if (payload === 'goto') {
      return shell.openExternal(id);
    }
    ncp.copy(id, function() {
        context.toast.enqueue('Pasted to clipboard !');
    })
  }

  function renderPreview(id, payload, render) {
    var preview = html.replace('%picture%', id);
    preview = preview.replace('%url%', id);
    render(preview);
  }

  return { startup, search: co.wrap(search), execute,renderPreview };
};
