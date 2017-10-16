const Promise = require('bluebird');
const _ = require('lodash');

const htmlToJson = require('html-to-json');
const downloadPackageTarball = require('download-package-tarball');
const api = require('api-npm');
const del = require('del');
const fs = require('fs');
const path = require('path');

const packagesDir = path.resolve(__dirname, '..', 'packages');

/**
  @class PackageController
  @constructor
*/

class PackageController {

  /**
  @method constructor
  @property packages {array}
  */
  constructor(from, to) {
    this.packages = [];
  }

  /**
  @method getTopDepended
  @param count {Number}
  @param [downloadPath = false] {String} Providing a path will download each package.
  @return {Promise}
  */
  getTopDepended(count, downloadPath = false) {

    const processingPromises = [];

    return new Promise((finalResolve) => {

      scrapeNpm()
        .then(removePackagesDir)
        .then((result) => {

        result = result.packages.slice(0,count);

        _.each(result, (name) => {

          processingPromises.push(new Promise((processingResolve) => {

            const pkg = { name: name };
            this.packages.push(pkg);

            getVersion(pkg)
              .then(pkg => downloadPackage(pkg, downloadPath))
              .then(processingResolve);

          }));

        });

        Promise.all(processingPromises).then(() => finalResolve());

      });

    });

  }
}

function downloadPackage(pkg, downloadPath) {

  pkg.link = 'https://registry.npmjs.org/' + pkg.name + '/-/' + pkg.name + '-' + pkg.version + '.tgz'

  if (!fs.existsSync(packagesDir)){
    fs.mkdirSync(packagesDir);
  }

  return downloadPackageTarball({
      // a npm tarball url will work
      url: pkg.link,
      dir: './packages/'
    }).catch(err => {
      console.log('oh crap the file could not be downloaded properly');
      console.log(err);
    });

}

/**
@method removePackagesDir
@param pkg {Object} a single package object within this.packages.
@return {Promise}
*/
function removePackagesDir(result) {

  return new Promise((removeDirResolve) => {

    fs.exists(packagesDir, (exists) => {
      if(exists) {

        del(packagesDir).then(paths => {
          removeDirResolve(result);
        }).catch(err => new Error(err));

      } else {
        removeDirResolve(result);
      }
    });

  });
}

/**
@method getVersion
@param pkg {Object} a single package object within this.packages.
@return {Promise}
*/
function getVersion(pkg) {

  const versionPromises = [];

  return new Promise((versionResolve) => {
    api.getdetails(pkg.name, (msg) => {
      pkg.version = msg['dist-tags']['latest'];
      versionResolve(pkg);
    });
  });

}


/**
@method scrapeNpm
@param url {Object} the link to the website
@return {Promise}
*/
function scrapeNpm() {

return scrapeWebsite('https://www.npmjs.com/browse/depended', {
  'packages': ['a.name', ($package) => {

    let url = $package.attr('href').split('/');
    let name = url[url.length-1];

    return name;
  }
]})

}


/**
@method scrapeWebsite
@param url {Object} the link to the website
@return {Promise}
*/
function scrapeWebsite(url, scrape) {

  return new Promise((websiteDownloadResolve) => {

    htmlToJson.request('https://www.npmjs.com/browse/depended', scrape,
    (err, result) => {
      if (err) return new Error(err);
      websiteDownloadResolve(result);
    });

  });

}

module.exports = PackageController;
