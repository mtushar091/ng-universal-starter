import 'zone.js/dist/zone-node';
import 'reflect-metadata';
import {renderModuleFactory} from '@angular/platform-server';
import {enableProdMode} from '@angular/core';
import {join} from 'path';
import {readFileSync} from 'fs';
import {provideModuleMap} from '@nguniversal/module-map-ngfactory-loader';
import * as express from 'express';

enableProdMode();

const app = express();
const cookieParser = require('cookie-parser');

/**
 * CONFIGURATION'S
 */
const PORT = process.env.PORT || 4000;

/**
 * !!Important
 * APP_FOLDER should be same as project name as well as project directory name
 * Changing DIST_FOLDER, APP_FOLDER values will need to update packages.json as well as angular.json
 * And some other files which includes tests.
 * IF you are changing these names, make sure you are checking them at following files
 * # packages.json
 * # angular.json
 * # app.module.ts
 * # karma.conf.js
 *
 * Also packages.lock.json file also contains the name, you might want to remove your packages.lock
 * as it will be created automatically on next npm install.
 */
const DIST_FOLDER = join(process.cwd(), 'dist');
const APP_FOLDER = 'ng-universal-starter';

/**
 * NOTE :: leave this as require() since this file is built Dynamically from webpack
 */
const {AppServerModuleNgFactory, LAZY_MODULE_MAP} = require('./dist/server/main');
app
  .use(cookieParser())
  .engine('html', (_, options: any, callback) => {
    const req = options.req;
    renderModuleFactory(AppServerModuleNgFactory, {
      document: readFileSync(join(DIST_FOLDER, APP_FOLDER, 'index.html')).toString(),
      url: req.url,
      extraProviders: [
        provideModuleMap(LAZY_MODULE_MAP),
        {
          provide: 'COOKIES',
          useValue: req.cookies || {}
        }
      ]
    }).then(html => {
      /**
       * Prints How much Memory the node is using to render the  application
       * With Each Request.
       */
      printMemoryUsage();
      return callback(null, html);
    });
  })
  .set('view engine', 'html')
  .set('views', join(DIST_FOLDER, APP_FOLDER))
  .get('*.*', express.static(join(DIST_FOLDER, APP_FOLDER)))
  .get('*', (req, res) => res.render(join(DIST_FOLDER, APP_FOLDER, 'index.html'), {req}))
  .listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));


function printMemoryUsage() {
  const used = process.memoryUsage();
  Object
    .keys(used)
    .forEach(key => {
      console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    });
}
