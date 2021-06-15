'use strict';

import EventEmitter from 'events';
import { Server } from 'http';
import { IUnleash } from './types/core';
import { IUnleashConfig, IUnleashOptions } from './types/option';
import version from './util/version';
import migrator from '../migrator';
import getApp from './app';
import MetricsMonitor, { createMetricsMonitor } from './metrics';
import { createStores } from './db';
import { createServices } from './services';
import { createConfig } from './create-config';
import User from './types/user';

import * as permissions from './types/permissions';
import AuthenticationRequired from './types/authentication-required';
import * as eventType from './types/events';
import { addEventHook } from './event-hook';
import registerGracefulShutdown from './util/graceful-shutdown';
import { IUnleashStores } from './types/stores';

async function closeServer(
    server: Server,
    metricsMonitor: MetricsMonitor,
): Promise<void> {
    metricsMonitor.stopMonitoring();

    return new Promise((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
    });
}

async function destroyDatabase(stores: IUnleashStores): Promise<void> {
    const { db, clientInstanceStore, clientMetricsStore } = stores;
    clientInstanceStore.destroy();
    clientMetricsStore.destroy();
    return db.destroy();
}

async function createApp(
    config: IUnleashConfig,
    startApp: boolean,
): Promise<IUnleash> {
    // Database dependencies (stateful)
    const logger = config.getLogger('server-impl.js');
    const serverVersion = version;
    const eventBus = new EventEmitter();
    const stores = createStores(config, eventBus);
    const services = createServices(stores, config);

    if (!config.server.secret) {
        const secret = await stores.settingStore.get('unleash.secret');
        // eslint-disable-next-line no-param-reassign
        config.server.secret = secret;
    }
    const app = getApp(config, stores, services, eventBus);
    const metricsMonitor = createMetricsMonitor();
    if (typeof config.eventHook === 'function') {
        addEventHook(config.eventHook, stores.eventStore);
    }
    metricsMonitor.startMonitoring(config, stores, serverVersion, eventBus);
    const unleash: Omit<IUnleash, 'stop'> = {
        stores,
        eventBus,
        services,
        app,
        config,
        version: serverVersion,
    };

    if (config.import.file) {
        await services.stateService.importFile({
            file: config.import.file,
            dropBeforeImport: config.import.dropBeforeImport,
            userName: 'import',
            keepExisting: config.import.keepExisting,
        });
    }

    return new Promise((resolve, reject) => {
        if (startApp) {
            const server = app.listen(config.listen, () =>
                logger.info('Unleash has started.', server.address()),
            );
            const stop = async () => {
                logger.info('Shutting down Unleash...');

                await closeServer(server, metricsMonitor);
                return destroyDatabase(stores);
            };

            server.keepAliveTimeout = config.server.keepAliveTimeout;
            server.headersTimeout = config.server.headersTimeout;
            server.on('listening', () => {
                resolve({ ...unleash, server, stop });
            });
            server.on('error', reject);
        } else {
            const stop = async () => {
                logger.info('Shutting down Unleash...');
                metricsMonitor.stopMonitoring();
                return destroyDatabase(stores);
            };

            resolve({ ...unleash, stop });
        }
    });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function start(opts: IUnleashOptions = {}): Promise<IUnleash> {
    const config = createConfig(opts);
    const logger = config.getLogger('server-impl.js');

    try {
        if (config.db.disableMigration) {
            logger.info('DB migrations disabled');
        } else {
            await migrator(config);
        }
    } catch (err) {
        logger.error('Failed to migrate db', err);
        throw err;
    }

    const unleash = await createApp(config, true);
    logger.info('register graceful shutdown');
    registerGracefulShutdown(unleash, logger);
    return unleash;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function create(opts: IUnleashOptions): Promise<IUnleash> {
    const config = createConfig(opts);
    const logger = config.getLogger('server-impl.js');

    try {
        if (config.db.disableMigration) {
            logger.info('DB migrations disabled');
        } else {
            await migrator(config);
        }
    } catch (err) {
        logger.error('Failed to migrate db', err);
        throw err;
    }
    return createApp(config, false);
}
const serverImpl = {
    start,
    create,
    User,
    AuthenticationRequired,
    permissions,
    eventType,
};
export default serverImpl;
module.exports = serverImpl;
