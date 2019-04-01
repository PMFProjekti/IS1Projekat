const { promisify } = require('util');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const toTitleCase = require('../utils/toTitleCase');

const randomBytesAsync = promisify(crypto.randomBytes);

// POST /login
exports.postLogin = (req, res, next) => {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).json(errors);
    }
    passport.authenticate('local', (errors, user, info) => {
        if (errors) {
            return res.status(400).json(errors);
        }
        if (!user) {
            return res.status(401).json({ message: "Bad Credentials" });
        }
        req.logIn(user, (errors) => {
            if (errors) {
                return res.status(400).json(errors);
            }
            let avatar = user.avatar(60);
            let loggedUser = { 
                id: user.id,
                role: user.role,
                email: req.body.email,
                name: user.profile.name,
                gender: user.profile.gender,
                avatar
            };
            return res.status(200).json(loggedUser);
        });
    })(req, res, next);
};
// POST /account/signup
exports.postSignup = (req, res, next) => {
    req.assert('name', "Invalid Name, has to be at least 4 characters long.").len(4);
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 8 characters long.').len(8);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).json(errors);
    }
    const user = new User({
        email: req.body.email,
        password: req.body.password,
        role: "unknown",
        profile: {
            name: req.body.name
        }
    });
    User.findOne({ email: req.body.email }, (errors, existingUser) => {
        if (errors) { 
            return res.status(400).json(errors);
        }
        if (existingUser) {
            return res.status(409).json({ message: 'Account with that email address already exists.' });
        }
        user.save((errors) => {
            if (errors) { 
                return res.status(400).json(errors);
            }
            req.logIn(user, (errors) => {
                if (errors) {
                    return res.status(400).json(errors);
                }
                let avatar = user.avatar(60);
                let signedUser = { 
                    role: 'unknown',
                    email: req.body.email,
                    name: user.profile.name,
                    gender: user.profile.gender,
                    avatar
                };
                return res.status(201).json(signedUser);
            });
        });
    });
};
// GET /account/find
exports.getAccount = (req, res) => {
    if(!req.query.id) {
        return res.status(422).json('Invalid group id');
    }
    User.findById(req.query.id, (errors, user) => {
        if (errors) {
            return res.status(400).json(errors);
        }
        if (!user) {
            return res.status(404).json( { message: 'Not Found' } );
        }
        var avatar = user.avatar(60);
        let requestedUser = { 
            id: user._id,
            role: user.role,
            email: user.email,
            name: user.profile.name,
            gender: user.profile.gender,
            avatar
        };
        return res.status(200).json(requestedUser);
    });
};
// POST /account/update
exports.postUpdateProfile = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
    let errors = req.validationErrors();
    if (errors) {
        return res.status(400).json(errors);
    }
    User.findOne({ email: req.body.email }, (errors, user) => {
        if (errors) {
            return res.status(400).json(errors);
        }
        if(!user) {
            return res.status(404).json({ message: 'Not Found' });
        }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';
        user.profile.gender = req.body.gender || '';
        user.profile.picture = req.body.picture || '';
        user.save((errors) => {
            if (errors) {
                return res.status(400).json(errors);
            }
            let avatar = user.avatar(60);
            let updatedUser = { 
                email: req.body.email,
                name: user.profile.name,
                gender: user.profile.gender,
                avatar
            };
            return res.status(200).json(updatedUser);
        });
    });
};
// POST /account/role
exports.postUpdateRole = (req, res, next) => {
    console.log(req.body);
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
    let errors = req.validationErrors();
    if (errors) {
        return res.status(400).json(errors);
    }
    User.findOne({ email: req.body.email }, (errors, user) => {
        if (errors) {
            return res.status(400).json(errors);
        }
        if(!user) {
            return res.status(404).json({ message: 'Not Found' });
        }
        user.role = req.body.role || 'unknown';
        user.save((errors) => {
            if (errors) {
                return res.status(400).json(errors);
            }
            return res.status(200).json({ message: 'Success' });
        });
    });
};

exports.postUpdateRole = (req, res, next) => {
    User.findOneAndUpdate({ email: req.body.email }, { role: req.body.role }, (err, user) => {
        if (err) { return next(err); }
        res.redirect('/account/overview');
    });
};

/**
* POST /account/password
* Update current password.
*/
exports.postUpdatePassword = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.password = req.body.password;
        user.save((err) => {
            if (err) { return next(err); }
            req.flash('success', { msg: 'Password has been changed.' });
            res.redirect('/account');
        });
    });
};

/**
* POST /account/delete
* Delete user account.
*/
exports.postDeleteAccount = (req, res, next) => {
    User.deleteOne({ _id: req.user.id }, (err) => {
        if (err) { return next(err); }
        req.logout();
        req.flash('info', { msg: 'Your account has been deleted.' });
        res.redirect('/');
    });
};

/**
* GET /account/unlink/:provider
* Unlink OAuth provider.
*/
exports.getOauthUnlink = (req, res, next) => {
    const { provider } = req.params;
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        const lowerCaseProvider = provider.toLowerCase();
        const titleCaseProvider = toTitleCase(provider);
        user[lowerCaseProvider] = undefined;
        const tokensWithoutProviderToUnlink = user.tokens.filter(token =>
            token.kind !== lowerCaseProvider);
        // Some auth providers do not provide an email address in the user profile.
        // As a result, we need to verify that unlinking the provider is safe by ensuring
        // that another login method exists.
        if (
            !(user.email && user.password)
            && tokensWithoutProviderToUnlink.length === 0
        ) {
            req.flash('errors', {
                msg: `The ${titleCaseProvider} account cannot be unlinked without another form of login enabled.`
                    + ' Please link another account or add an email address and password.'
            });
            return res.redirect('/account');
        }
        user.tokens = tokensWithoutProviderToUnlink;
        user.save((err) => {
            if (err) { return next(err); }
            req.flash('info', { msg: `${titleCaseProvider} account has been unlinked.` });
            res.redirect('/account');
        });
    });
};

/**
* GET /reset/:token
* Reset Password page.
*/
exports.getReset = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) { return next(err); }
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('/forgot');
            }
            res.render('account/reset', {
                title: 'Password Reset'
            });
        });
};

/**
* POST /reset/:token
* Process the reset password request.
*/
exports.postReset = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    const resetPassword = () =>
        User
            .findOne({ passwordResetToken: req.params.token })
            .where('passwordResetExpires').gt(Date.now())
            .then((user) => {
                if (!user) {
                    req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                    return res.redirect('back');
                }
                user.password = req.body.password;
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                return user.save().then(() => new Promise((resolve, reject) => {
                    req.logIn(user, (err) => {
                        if (err) { return reject(err); }
                        resolve(user);
                    });
                }));
            });

    const sendResetPasswordEmail = (user) => {
        if (!user) { return; }
        let transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USER,
                pass: process.env.SENDGRID_PASSWORD
            }
        });
        const mailOptions = {
            to: user.email,
            from: 'hackathon@starter.com',
            subject: 'Your Hackathon Starter password has been changed',
            text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
        };
        return transporter.sendMail(mailOptions)
            .then(() => {
                req.flash('success', { msg: 'Success! Your password has been changed.' });
            })
            .catch((err) => {
                if (err.message === 'self signed certificate in certificate chain') {
                    console.log('WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production.');
                    transporter = nodemailer.createTransport({
                        service: 'SendGrid',
                        auth: {
                            user: process.env.SENDGRID_USER,
                            pass: process.env.SENDGRID_PASSWORD
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });
                    return transporter.sendMail(mailOptions)
                        .then(() => {
                            req.flash('success', { msg: 'Success! Your password has been changed.' });
                        });
                }
                console.log('ERROR: Could not send password reset confirmation email after security downgrade.\n', err);
                req.flash('warning', { msg: 'Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.' });
                return err;
            });
    };

    resetPassword()
        .then(sendResetPasswordEmail)
        .then(() => { if (!res.finished) res.redirect('/'); })
        .catch(err => next(err));
};

/**
* GET /forgot
* Forgot Password page.
*/
exports.getForgot = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    });
};

/**
* POST /forgot
* Create a random token, then the send user an email with a reset link.
*/
exports.postForgot = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    const createRandomToken = randomBytesAsync(16)
        .then(buf => buf.toString('hex'));

    const setRandomToken = token =>
        User
            .findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('errors', { msg: 'Account with that email address does not exist.' });
                } else {
                    user.passwordResetToken = token;
                    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                    user = user.save();
                }
                return user;
            });

    const sendForgotPasswordEmail = (user) => {
        if (!user) { return; }
        const token = user.passwordResetToken;
        let transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USER,
                pass: process.env.SENDGRID_PASSWORD
            }
        });
        const mailOptions = {
            to: user.email,
            from: 'hackathon@starter.com',
            subject: 'Reset your password on Hackathon Starter',
            text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                http://${req.headers.host}/reset/${token}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
        return transporter.sendMail(mailOptions)
            .then(() => {
                req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
            })
            .catch((err) => {
                if (err.message === 'self signed certificate in certificate chain') {
                    console.log('WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production.');
                    transporter = nodemailer.createTransport({
                        service: 'SendGrid',
                        auth: {
                            user: process.env.SENDGRID_USER,
                            pass: process.env.SENDGRID_PASSWORD
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });
                    return transporter.sendMail(mailOptions)
                        .then(() => {
                            req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
                        });
                }
                console.log('ERROR: Could not send forgot password email after security downgrade.\n', err);
                req.flash('errors', { msg: 'Error sending the password reset message. Please try again shortly.' });
                return err;
            });
    };

    createRandomToken
        .then(setRandomToken)
        .then(sendForgotPasswordEmail)
        .then(() => res.redirect('/forgot'))
        .catch(next);
};

// GET /account/all
exports.getAll = (req, res) => {
    let params = { };
    if(req.query.role) params.role = req.query.role;
    User.find(params, function (err, users) {
        let allUsers = users.map(user => {
            return {
                id: user._id,
                name: user.profile.name,
                email: user.email,
                avatar: user.avatar(60),
                role: user.role
            }
        });
        res.setHeader('Content-Type', 'application/json');
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        return res.status(200).json(allUsers);
    });
};