const USE_DB = process.env.DB_PATH ? true : false;

let mongojs = USE_DB ? require('mongojs') : null;
let db = USE_DB ? mongojs(process.env.DB_PATH, ['account', 'progress']) : null;

// account: { username: string, password: string }
// progress: { username: string, items: [{id: string, amount: number }] }

Database = {};
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
                        password: data.password }, (err) => {
        Database.savePlayerProgress({ username: data.username, items: []}, function() {
            cb();
        });
    });
}

Database.getPlayerProgress = function(username, cb) {
    if(!USE_DB)
        return cb({ items: [] });
    db.progress.findOne({ username: username }, function(err, res) {
        if(err)
            console.log(err);
        if(!res)
            return cb({ items: [] })
        else
            return cb({ items: res.items });
    });
}

Database.savePlayerProgress = function(data, cb) {
    cb = cb || function() {}
    if(!USE_DB) return cb();
    db.progress.update({ username: data.username }, { $set: data }, { upsert: true }, cb);
}