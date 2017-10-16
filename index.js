'use strict'

const PackageController = require('./src/PackageController.js');

module.exports = download;

function download (count, callback) {
  
  callback();

  new PackageController().getTopDepended(count, './packages');
  
}