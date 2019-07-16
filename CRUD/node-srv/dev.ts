
// Bus. Layer test
import { CDB } from './lib/CDB'
const is = require('is')
const assert = require('assert')
const logger = require('tracer').console()
const perfy = require('perfy')
var bunyan = require('bunyan')

const cdb =new CDB()
cdb.init().then(tst)

async function tst() {
   perfy.start('loop-stuff');

   for (let i = 0; i < 10; i++) {

      logger.trace(is.array(await cdb.selectAll()))

   }

   var result = perfy.end('loop-stuff')
   console.log('', result.time )
}//()