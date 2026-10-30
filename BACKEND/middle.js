export const redirectUrl = (req, res, next) => {
    if (req.session.newUrl) {
        res.locals.redirect = req.session.newUrl;
    }
    next()
}
