const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs-extra')
const request = require('request')
const async = require("async")
let win
let connectionNumber
let whereToFolder
let filesObject
let gitFilesObject
let noOfDownloads
let group
let repository
let projectID
let token
let filesstorePath
let customHeaderRequest
let obj1 = {
    whereToFolder: process.env.PORTABLE_EXECUTABLE_DIR,
    filesObject: {},
    gitFilesObject: {},
    noOfDownloads: {},
    group: '',
    repository: '',
    projectID: '',
    token: '',
    filesstorePath: path.join(path.join(app.getPath('appData'), ''), 'repo1.json')
}
let obj2 = {
    whereToFolder: process.env.PORTABLE_EXECUTABLE_DIR,
    filesObject: {},
    gitFilesObject: {},
    noOfDownloads: {},
    group: '',
    repository: '',
    projectID: '',
    token: '',
    filesstorePath: path.join(path.join(app.getPath('appData'), ''), 'repo2.json')
}
let obj3 = {
    whereToFolder: process.env.PORTABLE_EXECUTABLE_DIR,
    filesObject: {},
    gitFilesObject: {},
    noOfDownloads: {},
    group: '',
    repository: '',
    projectID: '',
    token: '',
    filesstorePath: path.join(path.join(app.getPath('appData'), ''), 'repo3.json')
}
let obj4 = {
    whereToFolder: process.env.PORTABLE_EXECUTABLE_DIR,
    filesObject: {},
    gitFilesObject: {},
    noOfDownloads: {},
    group: '',
    repository: '',
    projectID: '',
    token: '',
    filesstorePath: path.join(path.join(app.getPath('appData'), ''), 'repo4.json')
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

fs.ensureDir(path.join(app.getPath('appData'), ''))

//=========== Start HERE ======================\\\
require('speedtest-net')().on('downloadspeed', speed => {
    connectionNumber = parseInt(0.3 * speed)
    if (connectionNumber < 2)
        connectionNumber = 3
    downloadFromGitPath('', 1, obj1, function() {
        downloadFromGitPath('', 1, obj2, function() {
            downloadFromGitPath('', 1, obj3, function() {
                downloadFromGitPath('', 1, obj4, function() {
                    win.webContents.send('info', getUpdateObject())
                })
            })
        })
    })
})
// downloadFromGitPath(obj1, function() {
//     win.webContents.send('info', getUpdateObject())
// })

function createWindow() {
    win = new BrowserWindow({ width: 1200, height: 600 })
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
    
    win.on('closed', () => {
        win = null
    })
}

function downloadFromGitPath(gitAll, repo, objt, cb) {
    whereToFolder = objt['whereToFolder']
    filesObject = objt['filesObject']
    gitFilesObject = objt['gitFilesObject']
    noOfDownloads = objt['noOfDownloads']
    group = objt['group']
    repository = objt['repository']
    projectID = objt['projectID']
    token = objt['token']
    filesstorePath = objt['filesstorePath']
    customHeaderRequest = request.defaults({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 640 LTE) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Mobile Safari/537.36 Edge/14.14390',
            'Private-Token': token
        }
    })

    if (!fs.existsSync(filesstorePath)) {
        fs.writeFileSync(filesstorePath, JSON.stringify(filesObject), 'utf8')
    } else {
        filesObject = JSON.parse(fs.readFileSync(filesstorePath, 'utf8'))
    }

    customHeaderRequest.get('https://gitlab.com/api/v4/projects/' + projectID + '/repository/branches/master', function(error, response, body) {
        let bodi = JSON.parse(response['body'])
        let id = bodi.commit.id
        
        customHeaderRequest.get('https://gitlab.com/api/v4/projects/' + projectID + '/repository/tree?recursive=1&page=' + repo + '&per_page=100', function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body == '[]') {
                    gitFilesObject = JSON.parse(gitAll)
				    let numberOfCards = gitFilesObject.length
				    let index = 0
                    for (index = 0; index < numberOfCards; index++) {
                        if (gitFilesObject[index]['type'] !== 'blob') {
                            continue
                        }
                        let folderName = path.dirname(gitFilesObject[index]['path'])
                        let fileName = path.posix.basename(gitFilesObject[index]['path'])
                        let key = folderName + '/' + fileName
                        fs.ensureDir(path.join(whereToFolder, folderName))
                        if (typeof filesObject[key] === 'undefined') {
                            filesObject[key] = { 'name': key, 'id': gitFilesObject[index]['id'], 'download_url': makeDownloadPath(folderName, fileName), 'downloaded': 0, savePath: path.join(whereToFolder, key), modified: 1, exists: 1 }
                        } else {
                            filesObject[key]['exists'] = 1
                            if (filesObject[key]['id'] !== gitFilesObject[index]['id']) {
                                filesObject[key]['downloaded'] = 0
                                filesObject[key]['id'] = gitFilesObject[index]['id']
                                filesObject[key]['modified'] = 1
                            } else {
                                if (!fs.existsSync(filesObject[key]['savePath'])) {
                                    if (!fs.existsSync(path.join(whereToFolder, key))) {
                                        filesObject[key]['downloaded'] = 0
                                        filesObject[key]['modified'] = 1
                                    } else {
                                        filesObject[key]['savePath'] = path.join(whereToFolder, key)
                                    }
                                }
                            }
                        }
                    }
                    finishedUpdatingCardObject(cb)
                } else if (repo === 1) {
                    downloadFromGitPath(body, repo + 1, objt, cb) 
                } else {
                    gitAll = gitAll.slice(0, -1) + ',' + body.slice(1)
                    downloadFromGitPath(gitAll, repo + 1, objt, cb)
                }
            } else {
                console.log(error)
                console.log(response.statusCode)
                process.exit()
            }
        })
    })
}

function downloadItems(cb) {
    let downloadObject = {}
    let delKeys = []
    for (let index in filesObject) {
        if (filesObject[index]['downloaded'] == 0) {
            downloadObject[index] = filesObject[index]
        }
        if (typeof filesObject[index]['exists'] === "undefined" || filesObject[index]['exists'] == 0) {
            filesObject[index]['exists'] = 0
            delKeys.push(index)
            fs.unkink(filesObject[index]['savePath'], function(err) {})
        }
    }
    for (var i in delKeys) {
        delete filesObject[delKeys[i]]
    }
    saveCardsObject()
    async.eachLimit(
        downloadObject,
        connectionNumber,
        (cardObject, next) => {
            downloadFilter(
                cardObject,
                next)
        },
        () => {
            saveCardsObject()
            cb()
        }
    )
}

function makeDownloadPath(folder, file) {
    return 'https://gitlab.com/' + group + '/' + repository + '/raw/master/' + folder + '/' + file
}

function updateCardObject(key) {
    filesObject[key]['downloaded'] = 1
    noOfDownloads++
    if (noOfDownloads % 300 == 0)
        saveCardsObject()
}

function finishedUpdatingCardObject(cb) {
    delete gitFilesObject
    saveCardsObject()
    downloadItems(cb)
}

function redoDownloadPathRepo1(key) {
    if (path.extname(key) === '.cdb') {
        filesObject[key]['savePath'] = path.join(whereToFolder, 'cdb/' + path.basename(key))
    }
    if (path.extname(key) === '.conf') {
        filesObject[key]['savePath'] = path.join(whereToFolder, 'config/' + path.basename(key))
    }
}

function downloadFilter(cardObject, next) {
    if ('Live2017Links' === repository) {
        redoDownloadPathRepo1(cardObject.name)
    }
    win.webContents.send('info', [cardObject['savePath']])
    download(
        cardObject['download_url'],
        cardObject['savePath'],
        cardObject.name,
        next
    )
}

function download(url, dest, key, next) {
    fs.ensureDir(path.dirname(dest), function() {
        const file = fs.createWriteStream(dest)
        customHeaderRequest.get(url).pipe(file).on('finish', function() {
            file.close()
            updateCardObject(key)
            next()
        }).on('error', function(e) {
            file.close()
            next()
        }).on('end', function() {
            file.close()
            next()
        })
    })
}

function saveCardsObject() {
    fs.writeFileSync(filesstorePath, JSON.stringify(filesObject), 'utf8')
}

let getUpdateObject = () => {
    let modifiedFiles = []
    let filesObject
    modifiedFiles.push('ダウンロード成功! (≧▽≦) お疲れ様！')
    
    if (fs.existsSync(obj1.filesstorePath)) {
        filesObject = JSON.parse(fs.readFileSync(obj1.filesstorePath, 'utf8'))
        for (let index in filesObject) {
            if (filesObject[index]['modified'] == 1) {
                modifiedFiles.push(filesObject[index]['savePath'].replace(whereToFolder, ''))
                filesObject[index]['modified'] = 0

                fs.writeFileSync(obj1.filesstorePath, JSON.stringify(filesObject), 'utf8')
            }
        }
    }
    if (fs.existsSync(obj2.filesstorePath)) {
        filesObject = JSON.parse(fs.readFileSync(obj2.filesstorePath, 'utf8'))
        for (let index in filesObject) {
            if (filesObject[index]['modified'] == 1) {
                modifiedFiles.push(filesObject[index]['savePath'].replace(whereToFolder, ''))
                filesObject[index]['modified'] = 0

                fs.writeFileSync(obj2.filesstorePath, JSON.stringify(filesObject), 'utf8')
            }
        }
    }
    if (fs.existsSync(obj3.filesstorePath)) {
        filesObject = JSON.parse(fs.readFileSync(obj3.filesstorePath, 'utf8'))
        for (let index in filesObject) {
            if (filesObject[index]['modified'] == 1) {
                modifiedFiles.push(filesObject[index]['savePath'].replace(whereToFolder, ''))
                filesObject[index]['modified'] = 0

                fs.writeFileSync(obj3.filesstorePath, JSON.stringify(filesObject), 'utf8')
            }
        }
    }
    if (fs.existsSync(obj4.filesstorePath)) {
        filesObject = JSON.parse(fs.readFileSync(obj4.filesstorePath, 'utf8'))
        for (let index in filesObject) {
            if (filesObject[index]['modified'] == 1) {
                modifiedFiles.push(filesObject[index]['savePath'].replace(whereToFolder, ''))
                filesObject[index]['modified'] = 0

                fs.writeFileSync(obj4.filesstorePath, JSON.stringify(filesObject), 'utf8')
            }
        }
    }
    return modifiedFiles
}