/*
 * Copyright (C) 2012-2013 Vanderbilt University, All rights reserved.
 *
 * Author: Tamas Kecskes
 */

define([ "util/assert" ], function (ASSERT) {
	"use strict";

	function Database (_database, options) {
		ASSERT(typeof options === "object" && typeof _database === "object");
		options.log = options.log || {
			debug: function (msg) {
				console.log("DEBUG - " + msg);
			},
			error: function (msg) {
				console.log("ERROR - " + msg);
			}
		};
		var logger = options.log;

		function openDatabase (callback) {
			logger.debug('openDatabase()');
			_database.openDatabase(callback);
		}

		function closeDatabase (callback) {
			logger.debug('closeDatabase()');
			_database.closeDatabase(callback);
		}

		function fsyncDatabase (callback) {
			logger.debug('fsyncDatabase()');
			_database.fsyncDatabase(callback);
		}

		function getProjectNames (callback) {
			logger.debug('getProjectNames()');
			_database.getProjectNames(callback);
		}

		function deleteProject (project, callback) {
			logger.debug('deleteProject(' + project + ")");
			_database.deleteProject(project, callback);
		}

		function getDatabaseStatus (oldstatus, callback) {
			logger.debug('getDatabaseStatus(' + oldstatus + ")");
			_database.getDatabaseStatus(oldstatus, callback);
		}

        function authenticate (username,privatekey, callback){
            logger.debug('authenticate('+username+',***)');
            _database.authenticate(username,privatekey,callback);
        }

		function openProject (projectName, callback) {
			logger.debug('openProject(' + projectName + ")");
			var project = null;
			_database.openProject(projectName, function (err, proj) {
				if (!err && proj) {
					project = proj;
					callback(null, {
						fsyncDatabase: fsyncDatabase,
						closeProject: closeProject,
						loadObject: loadObject,
						insertObject: insertObject,
						findHash: findHash,
						dumpObjects: dumpObjects,
						getBranchNames: getBranchNames,
						getBranchHash: getBranchHash,
						setBranchHash: setBranchHash,
						getCommits: getCommits,
						makeCommit: makeCommit,
						ID_NAME: project.ID_NAME
					});
				} else {
					callback(err, proj);
				}
			});

			function fsyncDatabase (callback) {
				logger.debug(projectName + '.fsyncDatabase()');
				project.fsyncDatabase(callback);
			}

			function closeProject (callback) {
				logger.debug(projectName + '.closeProject()');
				project.closeProject(callback);
			}

			function insertObject (object, callback) {
				logger.debug(projectName + '.insertObject(' + object[project.ID_NAME] + ")");
				project.insertObject(object, callback);
			}

			function loadObject (hash, callback) {
				logger.debug(projectName + '.loadObject(' + hash + ")");
				project.loadObject(hash, callback);
			}

			function findHash (beginning, callback) {
				logger.debug(projectName + ".findHash(" + beginning + ")");
				project.findHash(beginning, callback);
			}

			function dumpObjects (callback) {
				logger.debug(projectName + "dumpObjects()");
				project.dumpObjects(callback);
			}

			function getBranchNames (callback) {
				logger.debug(projectName + '.getBranchNames()');
				project.getBranchNames(callback);
			}

			function getBranchHash (branch, oldhash, callback) {
				logger.debug(projectName + '.getBranchHash(' + branch + ',' + oldhash + ')');
				project.getBranchHash(branch, oldhash, function (err, newhash, forked) {
					logger.debug(projectName + '.getBranchHash(' + branch + ',' + oldhash + ')->(' + JSON.stringify(err) + ',' + newhash + ',' + forked + ')');
					callback(err, newhash, forked);
				});
			}

			function setBranchHash (branch, oldhash, newhash, callback) {
				logger.debug(projectName + '.setBranchHash(' + branch + ',' + oldhash + ',' + newhash + ')');
				project.setBranchHash(branch, oldhash, newhash, function (err) {
					logger.debug(projectName + '.setBranchHash(' + branch + ',' + oldhash + ',' + newhash + ') ->(' + JSON.stringify(err) + ')');
					callback(err);
				});
			}

			function getCommits (before, number, callback) {
				logger.debug(projectName + '.getCommits(' + before + ',' + number + ')');
				project.getCommits(before, number, callback);
			}

			function makeCommit (parents, roothash, msg, callback) {
				logger.debug(projectName + '.makeCommit(' + parents + ',' + roothash + ',' + msg + ')');
				return project.makeCommit(parents, roothash, msg, callback);
			}
		}

		return {
			openDatabase: openDatabase,
			closeDatabase: closeDatabase,
			fsyncDatabase: fsyncDatabase,
			getProjectNames: getProjectNames,
			getDatabaseStatus: getDatabaseStatus,
			openProject: openProject,
			deleteProject: deleteProject,
            authenticate: authenticate
		};
	}

	return Database;
});
