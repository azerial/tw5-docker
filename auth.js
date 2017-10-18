#!/usr/bin/env node

const bodyParser = require('body-parser');
const ensureLogin = require('connect-ensure-login');
const express = require('express');
const local = require('passport-local');
const passport = require('passport');
const path = require('path');
const proxy = require('express-http-proxy');
const session = require('express-session');
const url = require('url');


const user = {
    id: 0,
    username: process.env.USERNAME || 'user',
    password: process.env.PASSWORD || 'tiddlywiki',
};

passport.use(new local.Strategy((username, password, done) => {
    if (
        username !== user.username ||
        password !== user.password
    ) {
        done(null, false, {message: 'Incorrect login'});
    }
    else {
        done(null, user);
    }
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((userId, done) => {
    if (userId !== user.id) {
        done('Unknown user');
    }
    else {
        done(null, user);
    }
});

const app = express();
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'tiddlytiddly',
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/wiki/tiddlers/favicon.ico'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});
app.post('/login', passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
}));
app.use('*', ensureLogin.ensureLoggedIn('/login'), proxy('localhost:8888', {
    proxyReqPathResolver: (req) => {
        return req.originalUrl;
    },
}));
app.listen(8080);