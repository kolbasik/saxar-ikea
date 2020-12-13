// see: https://github.com/mochajs/mocha/tree/master/example/config
module.exports = {
    "exit": true,
    "recursive": true,
    "retries": 0,
    "ui": "bdd",
    "diff": true,
    "full-trace": true,
    "forbid-only": true,
    "require": ["ts-node/register"],
};
