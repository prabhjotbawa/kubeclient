import { writeFileSync } from 'fs';
import { resolve } from 'path';
import path from 'path';
import { MongoClient } from 'mongodb';
import { time, timeStamp } from 'console';

class JestMetricsReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options || {};
        this._options.mongoUrl = this._options.mongoUrl || 'mongodb://localhost:27017';
        this._options.dbName = this._options.dbName || 'jestMetrics';
        this._options.collectionName = this._options.collectionName || 'testResults';
        this._options.projectName = this._options.projectName || 'default-project';
        this._client = null;
        this._db = null;
        this._collection = null;
    }

    async onRunComplete(contexts, results) {
        const suiteMetrics = [];
        results.testResults.forEach(suite => {
            const numPassed = suite.testResults.filter(test => test.status === 'passed').length;
            const numFailed = suite.testResults.filter(test => test.status === 'failed').length;
            const numTotal = suite.testResults.length;
            const suiteName = suite.testFilePath.split('/').pop().split('.')[0];
            const duration = suite.perfStats.runtime / 1000; // Convert to seconds
            const numPending = suite.testResults.filter(test => test.status === 'pending').length;

            suiteMetrics.push({
                project: this._options.projectName,
                suite: suiteName,
                tests_pass: numPassed,
                tests_fail: numFailed,
                tests_total: numTotal,
                tests_duration: duration,
                tests_pending: numPending,
                timeStamp: new Date().toISOString()
            });

        });

        try{
            const client = new MongoClient(this._options.mongoUrl);
            await client.connect();
            this._db = client.db(this._options.dbName);
            this._collection = this._db.collection(this._options.collectionName);
            await this._collection.insertMany(suiteMetrics);
            console.log('Metrics successfully inserted into MongoDB');
            await client.close();
        } catch (error) {
            console.error('Error inserting metrics into MongoDB:', error);
        }
    }
}

export default JestMetricsReporter;