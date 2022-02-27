'use strict';

const editAccount = require(__dirname+'/../../models/forms/editaccount.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, Permissions = require(__dirname+'/../../helpers/permissions.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: 'Username must contain a-z 0-9 only' },
			{ result: async () => {
				res.locals.editingAccount = await Accounts.findOne(req.body.username);
				return res.locals.editingAccount != null;
			}, expected: true, error: 'Invalid account username' },
			{ result: (res.locals.user.username === req.body.username), expected: false, error: "You can't edit your own permissions" },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
			});
		}

		try {
			await editAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
