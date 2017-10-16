const Promise = require('bluebird');
const _ = require('lodash');

const htmlToJson = require('html-to-json');
const downloadPackageTarball = require('download-package-tarball');
const api = require('api-npm');
const del = require('del');
const fs = require('fs');
const path = require('path');

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

    return new Promise((resolve) => {

      console.log('promise 0 started');

      htmlToJson.request('https://www.npmjs.com/browse/depended', {
        'packages': ['a.name', ($package) => {

          let url = $package.attr('href').split('/');
          let name = url[url.length-1];

          return name;
        }]

      }, (err, result) => {

        result = result.packages.slice(0,count);

        let dir = path.resolve(__dirname, '..', 'packages');

        var removeDirPromise = new Promise((removeDirResolve) => {


          fs.exists(dir, (exists) => {
            if(exists) {

              del(dir).then(paths => {
                removeDirResolve();
              });

            } else {
              removeDirResolve();
            }
          });

        });

        removeDirPromise.then((pkg) => {
          return pkg;
        }).then((pkg) => {

          _.each(result, (name) => {

            dir = path.resolve(__dirname, '..', 'packages');

            const processingPackagePromise = new Promise((processingResolve) => {

              const pkg = { name: name };

              this.packages.push(pkg);

              getVersion(pkg).then(getLink).then((pkg) => {

                return new Promise((downloadResolve) => {
                  if(!downloadPath) downloadResolve();

                  if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);

                    downloadPackageTarball({
                      // a npm tarball url will work
                      url: pkg.link,
                      dir: './packages/'
                    }).then(downloadResolve).catch(err => {
                      console.log('oh crap the file could not be downloaded properly');
                      console.log(err);
                    });

                  } else {

                    downloadPackageTarball({
                      // a npm tarball url will work
                      url: pkg.link,
                      dir: './packages/'
                    }).then(downloadResolve).catch(err => {
                      console.log('oh crap the file could not be downloaded properly');
                      console.log(err);
                    });

                  }

                }).then(processingResolve);

              });
            });

            processingPromises.push(processingPackagePromise);

          });

          Promise.all(processingPromises).then(resolve);

        });
      });

    }).then(() => {
      console.log('promise 0 finished')
    });
  }
}

/**
@method getVersion
@param pkg {Object} a single package object within this.packages.
@return {Promise}
*/
function getVersion(pkg) {

  const versionPromises = [];

  return new Promise((resolve) => {
    api.getdetails(pkg.name, (msg) => {
      pkg.version = msg['dist-tags']['latest'];
      resolve(pkg);
    });
  });

}

/**
@method getLink
@param pkg {Object} a single package object within this.packages.
@return {Promise}
*/
function getLink(pkg) {

  return new Promise((resolve) => {
    pkg.link = 'https://registry.npmjs.org/' + pkg.name + '/-/' + pkg.name + '-' + pkg.version + '.tgz'
    resolve(pkg);
  });

}

module.exports = PackageController;
