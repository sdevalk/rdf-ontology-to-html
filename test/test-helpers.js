'use strict';

const Http = require('http');

exports.getServer = function (handler) {

    const server = Http.createServer(handler);

    return new Promise((resolve) => {

        server.listen(0, () => resolve(server));
    });
};
