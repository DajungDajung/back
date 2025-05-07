const parseCookies = (header = '') =>{
    return header
        .split(';')
        .map(cookie => cookie.trim().split('='))
        .reduce((acc, [key, val]) => {
            acc[key] = val;
            return acc;
        }, {});
}

module.exports = parseCookies;