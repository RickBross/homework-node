'use strict'

const PackageController = require('./src/PackageController.js');

module.exports = download;

function download (count) {

  return new PackageController().getTopDepended(count, './packages');

}
