const USE_DB = process.env.DB_PATH ? true : false;

let mongojs = USE_DB ? require('mongojs') : null;
let db = USE_DB ? mongojs(process.env.DB_PATH, ['account', 'progress']) : null;

// account: { username: string, password: string }
// progress: { username: string, items: [{id: string, amount: number }], friends: {} }

let Database = {};
Database.isValidPassword = (data, cb) => {
    if(!USE_DB) return cb(true);
    db.account.findOne({ username: data.username,
                      password: data.password }, (err, res) => {
        if(res) {
            cb(true);
        } else {
            cb(false);
        }
    });
}

Database.isUsernameTaken = (data, cb) => {
    if(!USE_DB) return cb(false);
    db.account.findOne({ username: data.username }, (err, res) => {
        if(res) {
            cb(true);
        } else {
            cb(false);
        }
    });
}

Database.addUser = (data, cb) => {
    if(!USE_DB) return cb();
    db.account.insert({ username: data.username,
                        password: data.password,
                        gender: data.gender }, (err) => {
        Database.savePlayerProgress({ username: data.username, items: [], friends: {}}, function() {
            cb();
        });
    });
}

Database.getPlayerProgress = function(username, cb) {
    if(!USE_DB)
        return cb({ items: [], friends: {} });
    db.progress.findOne({ username: username }, function(err, res) {
        if(err)
            console.log(err);
        if(!res)
            return cb({ items: [], friends: {} })
        else {
            let progress = { items: res.items, friends: res.friends, x: res.x, y: res.y, mapName: res.map, score: res.score, gender: 0 };
            db.account.findOne({ username: username }, function(err, res) {
                if(err) console.log(err);
                if(!res) return cb(progress);
                else {
                    if(res.gender) progress.gender = res.gender;
                    return cb(progress);
                }
            })
        }
    });
}

Database.savePlayerProgress = function(data, cb) {
    cb = cb || function() {}
    if(!USE_DB) return cb();
    db.progress.update({ username: data.username }, { $set: data }, { upsert: true }, cb);
}

module.exports = Database;