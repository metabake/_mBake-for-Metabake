"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Base_1 = require("mbake/lib/Base");
const FileOpsBase_1 = require("mbake/lib/FileOpsBase");
const FileOpsExtra_1 = require("mbake/lib/FileOpsExtra");
const Email_1 = require("../lib/Email");
const Serv_1 = require("mbake/lib/Serv");
const Auth_1 = require("../lib/Auth");
const FileMethods_1 = require("../lib/FileMethods");
const fs = require('fs-extra');
class EditorRoutes extends Serv_1.BasePgRouter {
    constructor(appE, adbDB) {
        super();
        this.ROUTES = (req, res) => {
            const emailJs = new Email_1.Email();
            const fs = require('fs');
            const path = require('path');
            let mountPath = '';
            const user = req.fields.user;
            const pswd = req.fields.pswd;
            const method = req.fields.method;
            const params = JSON.parse(req.fields.params);
            const resp = {};
            console.log('method ---------> ', method);
            if (method === 'reset-password-code') {
                let email = params.admin_email;
                resp.result = {};
                try {
                    return this.adbDB.sendVcodeEditor(email)
                        .then(code => {
                        this.adbDB.getEmailJsSettings()
                            .then(settings => {
                            let setting = settings[0];
                            emailJs.send(email, setting.emailjsService_id, setting.emailjsTemplate_id, setting.emailjsUser_id, 'your code: ' + code);
                            resp.result = true;
                            return res.json(resp);
                        });
                    });
                }
                catch (err) {
                    return res.json(resp);
                }
            }
            else if (method === 'reset-password') {
                resp.result = {};
                let email = params.admin_email;
                return this.adbDB.resetPasswordEditor(email, params.code, params.password)
                    .then(result => {
                    resp.result = result;
                    return res.json(resp);
                });
            }
            else if (method === 'check-editor') {
                let user = Buffer.from(params.editor_email).toString('base64');
                let pswd = Buffer.from(params.editor_pass).toString('base64');
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        resp.result = true;
                        return res.json(resp);
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'get-items') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        resp.result = this.fileMethod.getDirs(mountPath);
                        res.json(resp);
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'get-files') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let post_id = '/' + params.post_id;
                        if (typeof post_id !== 'undefined') {
                            resp.result = this.fileMethod.getFiles(mountPath, post_id);
                            res.json(resp);
                        }
                        else {
                            res.status(400);
                            resp.result = { error: 'no post_id' };
                            res.json(resp);
                        }
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'get-file-content') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let post_id = params.post_id;
                        let pathPrefix = params.pathPrefix;
                        if (typeof post_id !== 'undefined') {
                            let md = mountPath + '/' + pathPrefix + post_id;
                            let original_post_id = post_id.replace(/\.+\d+$/, "");
                            let fileExt = path.extname(original_post_id);
                            if (fs.existsSync(md) && (fileExt === '.md' || fileExt === '.yaml' || fileExt === '.csv' || fileExt === '.pug' || fileExt === '.css')) {
                                fs.readFile(md, 'utf8', (err, data) => {
                                    if (err)
                                        throw err;
                                    resp.result = data;
                                    res.json(resp);
                                });
                            }
                            else {
                                throw "Unknown file type!";
                            }
                        }
                        else {
                            res.status(400);
                            resp.result = { error: 'no post_id' };
                            res.json(resp);
                        }
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'save-file') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let post_id = params.post_id;
                        let pathPrefix = params.pathPrefix;
                        let content = params.content;
                        content = Buffer.from(content, 'base64');
                        if (typeof post_id !== 'undefined') {
                            let md = '/' + pathPrefix + post_id;
                            let fileOps = new FileOpsBase_1.FileOps(mountPath);
                            fileOps.write(md, content);
                            let dirCont = new FileOpsBase_1.Dirs(mountPath);
                            let substring = '/';
                            let checkDat = dirCont.getInDir('/' + pathPrefix).filter(file => file.endsWith('dat.yaml'));
                            if (checkDat.length > 0) {
                                const archivePath = '/' + pathPrefix + '/archive';
                                if (!fs.existsSync(mountPath + archivePath)) {
                                    fs.mkdirSync(mountPath + archivePath);
                                }
                                let archiveFileOps = new FileOpsBase_1.FileOps(mountPath + archivePath);
                                let extension = path.extname(post_id);
                                let fileName = path.basename(post_id, extension);
                                let count = archiveFileOps.count(path.basename(post_id));
                                let archiveFileName = '/' + fileName + extension + '.' + count;
                                archiveFileOps.write(archiveFileName, content);
                            }
                            if (pathPrefix.includes(substring)) {
                                pathPrefix = pathPrefix.substr(0, pathPrefix.indexOf('/'));
                            }
                            resp.result = { data: 'OK' };
                            res.json(resp);
                        }
                        else {
                            res.status(400);
                            resp.result = { error: 'no post_id' };
                            res.json(resp);
                        }
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'compile-code') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let post_id = params.post_id;
                        let pathPrefix = params.pathPrefix;
                        if (typeof post_id !== 'undefined') {
                            let runMbake = new Base_1.MBake();
                            let dirCont = new FileOpsBase_1.Dirs(mountPath);
                            let checkCsv = dirCont.getInDir('/' + pathPrefix).filter(file => file.endsWith('.csv'));
                            if (checkCsv.length > 0) {
                                let compileCsv = new FileOpsExtra_1.CSV2Json(mountPath + '/' + pathPrefix);
                                compileCsv.convert();
                            }
                            let checkDat_i = dirCont.getInDir('/' + pathPrefix).filter(file => file.endsWith('dat_i.yaml'));
                            if (checkDat_i.length > 0) {
                                runMbake.itemizeNBake(mountPath + '/' + pathPrefix, 3)
                                    .then(response => {
                                    resp.result = { data: 'OK' };
                                    res.json(resp);
                                }, error => {
                                    resp.result = { data: error };
                                    res.json(resp);
                                });
                            }
                            else {
                                runMbake.compsNBake(mountPath, 3).then(response => {
                                    resp.result = { data: 'OK' };
                                    res.json(resp);
                                }, error => {
                                    resp.result = { data: error };
                                    res.json(resp);
                                });
                            }
                        }
                        else {
                            res.status(400);
                            resp.result = { error: 'no post_id' };
                            res.json(resp);
                        }
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'clone-page') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let post_id = params.post_id;
                        let pathPrefix = params.pathPrefix;
                        if (typeof post_id !== 'undefined'
                            && typeof pathPrefix !== 'undefined') {
                            let postPath = mountPath + '/' + pathPrefix;
                            let substring = '/';
                            let newPost = '';
                            if (pathPrefix.includes(substring)) {
                                pathPrefix = pathPrefix.substr(0, pathPrefix.indexOf('/'));
                                newPost = mountPath + '/' + pathPrefix + '/' + post_id;
                            }
                            else {
                                newPost = mountPath + '/' + post_id;
                            }
                            let fileOps = new FileOpsBase_1.FileOps('/');
                            fileOps.clone(postPath, newPost);
                            resp.result = { data: 'OK' };
                            res.json(resp);
                        }
                        else {
                            res.status(400);
                            resp.result = { error: 'error creating a post' };
                            res.json(resp);
                        }
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'upload') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let uploadPath;
                        let pathPrefix = params.pathPrefix;
                        if (Object.keys(req.files).length == 0) {
                            res.status(400);
                            resp.result = { error: 'no file was uploaded' };
                            return res.json(resp);
                        }
                        let sampleFile = req.files.sampleFile;
                        uploadPath = mountPath + '/' + pathPrefix + '/' + sampleFile.name;
                        fs.rename(sampleFile.path, uploadPath, err => {
                            if (err)
                                throw err;
                            resp.result = { data: 'File uploaded!' };
                            res.json(resp);
                        });
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'set-publish-date') {
                return this.iauth.auth(user, pswd, res).then(auth => {
                    if (auth === 'admin' || auth === 'editor') {
                        mountPath = res.locals.mountPath;
                        let post_id = params.post_id;
                        let publish_date = params.publish_date;
                        if (typeof post_id !== 'undefined') {
                            let datYaml = new FileOpsBase_1.Dat(mountPath + '/' + post_id);
                            datYaml.set('publishDate', publish_date);
                            datYaml.write();
                            let runMbake = new Base_1.MBake();
                            let postsFolder = post_id.substr(0, post_id.indexOf('/'));
                            let pro = runMbake.itemizeNBake(mountPath + '/' + postsFolder, 3);
                            resp.result = { data: 'OK' };
                            res.json(resp);
                        }
                        else {
                            res.status(400);
                            resp.result = { error: 'no post_id' };
                            res.json(resp);
                        }
                    }
                    else {
                        resp.errorLevel = -1;
                        resp.errorMessage = 'mismatch';
                        res.json(resp);
                    }
                });
            }
            else if (method === 'mbake-version') {
                resp.result = Base_1.Ver.ver();
                res.json(resp);
            }
            ;
            resp.errorLevel = -1;
            resp.errorMessage = 'mismatch';
            res.json(resp);
        };
        this.appE = appE;
        this.adbDB = adbDB;
        this.iauth = new Auth_1.Auth(appE, adbDB);
        this.fileMethod = new FileMethods_1.FileMethods();
    }
}
exports.EditorRoutes = EditorRoutes;
module.exports = {
    EditorRoutes
};